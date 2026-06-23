import { clerkClient } from "@clerk/express";
import { prisma } from "./prismaClient.js";

// ============================================================================
// HELPER FUNCTIONS (Formatting strings before saving to DB)
// ============================================================================
function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeEmail(value) {
  return normalizeString(value).toLowerCase();
}

function normalizeHandle(value) {
  const raw = normalizeString(value).toLowerCase();
  if (!raw) return "";
  return raw.startsWith("@") ? raw : `@${raw}`;
}

function slugify(value) {
  return normalizeString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 24);
}

function randomSuffix(length = 4) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

function getPrimaryEmail(clerkUser = {}) {
  if (clerkUser.email) return normalizeEmail(clerkUser.email);
  if (clerkUser.email_address) return normalizeEmail(clerkUser.email_address);
  if (clerkUser.primary_email_address) {
    return normalizeEmail(clerkUser.primary_email_address);
  }
  if (clerkUser.primaryEmailAddress?.emailAddress) {
    return normalizeEmail(clerkUser.primaryEmailAddress.emailAddress);
  }
  if (
    Array.isArray(clerkUser.email_addresses) &&
    clerkUser.email_addresses.length > 0
  ) {
    const primaryId = clerkUser.primary_email_address_id;
    const picked =
      clerkUser.email_addresses.find((entry) => entry.id === primaryId) ||
      clerkUser.email_addresses[0];
    return normalizeEmail(picked?.email_address);
  }
  if (
    Array.isArray(clerkUser.emailAddresses) &&
    clerkUser.emailAddresses.length > 0
  ) {
    const primaryId = clerkUser.primaryEmailAddressId;
    const picked =
      clerkUser.emailAddresses.find((entry) => entry.id === primaryId) ||
      clerkUser.emailAddresses[0];
    return normalizeEmail(picked?.emailAddress || picked?.email_address);
  }
  return "";
}

function getFallbackEmail(clerkId) {
  return `${slugify(clerkId) || randomSuffix(8)}@clerk.local`;
}

function getDisplayName(clerkUser = {}) {
  const firstName = normalizeString(
    clerkUser.first_name || clerkUser.firstName,
  );
  const lastName = normalizeString(clerkUser.last_name || clerkUser.lastName);
  const full = `${firstName} ${lastName}`.trim();

  if (full) return full;
  if (normalizeString(clerkUser.name)) return normalizeString(clerkUser.name);
  if (normalizeString(clerkUser.username))
    return normalizeString(clerkUser.username);
  return "Ziele User";
}

function makeAvatar(name) {
  const words = normalizeString(name).split(/\s+/).filter(Boolean);
  if (words.length === 0) return "ZU";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] || ""}${words[1][0] || ""}`.toUpperCase();
}

function deriveHandleCandidate(clerkUser = {}, email = "", name = "") {
  const username = normalizeString(clerkUser.username);
  if (username) return `@${username}`;
  const nickname = normalizeString(clerkUser.nickname);
  if (nickname) return `@${nickname}`;
  const fromName = slugify(name);
  if (fromName) return `@${fromName}${randomSuffix(4)}`;
  const fromEmail = slugify(email.split("@")[0]);
  if (fromEmail) return `@${fromEmail}${randomSuffix(4)}`;
  return `@user${randomSuffix(4)}`;
}

function buildProfileCreateData(clerkUser, email, displayName) {
  const handleCandidate = deriveHandleCandidate(clerkUser, email, displayName);

  return async function createData() {
    const handle = await getUniqueHandle(handleCandidate);
    const profileId = handle.replace(/^@/, "");

    return {
      id: profileId,
      name: displayName,
      handle,
      avatar: makeAvatar(displayName),
      joined: new Date().toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
    };
  };
}

export function clerkUserFromAuthContext(authContext = {}) {
  const claims =
    authContext?.raw?.sessionClaims || authContext?.sessionClaims || {};
  const clerkId = normalizeString(authContext?.userId || claims.sub);

  if (!clerkId) return null;

  return {
    id: clerkId,
    email:
      claims.email ||
      claims.email_address ||
      claims.primary_email_address ||
      claims.primaryEmailAddress,
    first_name: claims.given_name || claims.first_name || claims.firstName,
    last_name: claims.family_name || claims.last_name || claims.lastName,
    name: claims.name,
    username: claims.username || claims.preferred_username,
    nickname: claims.nickname,
    image_url: claims.picture || claims.image_url || claims.imageUrl,
  };
}

async function getClerkUserFromApi(clerkId) {
  try {
    return await clerkClient.users.getUser(clerkId);
  } catch (error) {
    console.error("Failed to fetch Clerk user for local sync", {
      clerkId,
      error: error?.message || error,
    });
    return null;
  }
}

async function getUniqueHandle(baseHandle) {
  let candidate = normalizeHandle(baseHandle || "@user");
  let exists = await prisma.profile.findUnique({
    where: { handle: candidate },
  });

  if (!exists) return candidate;

  // if exists, append random suffixes until unique
  while (exists) {
    candidate = normalizeHandle(
      `${baseHandle.replace(/^@/, "")}${randomSuffix(4)}`,
    );
    exists = await prisma.profile.findUnique({ where: { handle: candidate } });
  }
  return candidate;
}

// ============================================================================
// EXPORTED PRISMA LOGIC
// ============================================================================

export async function getClerkUsers() {
  return await prisma.user.findMany({ include: { profile: true } });
}

export async function findUserByClerkId(clerkId) {
  if (!clerkId) return null;
  return await prisma.user.findUnique({
    where: { clerkId: String(clerkId) },
    include: { profile: true },
  });
}

export async function findProfileByClerkId(clerkId) {
  if (!clerkId) return null;
  return await prisma.profile.findUnique({
    where: { clerkId: String(clerkId) },
  });
}

export async function getProfileForClerkUser(clerkId) {
  return await findProfileByClerkId(clerkId);
}

export async function ensureProfileForAuthContext(authContext = {}) {
  const clerkId = normalizeString(authContext?.userId);
  if (!clerkId) return null;

  const existingProfile = await findProfileByClerkId(clerkId);
  if (
    existingProfile &&
    existingProfile.name !== "Ziele User" &&
    existingProfile.avatar !== "ZU"
  ) {
    return existingProfile;
  }

  const clerkUser =
    (await getClerkUserFromApi(clerkId)) || clerkUserFromAuthContext(authContext);
  if (!clerkUser) return null;

  const syncedUser = await upsertUserFromClerk(clerkUser);
  return syncedUser?.profile || findProfileByClerkId(clerkId);
}

// Fired by webhook when user signs up or changes their Clerk profile
export async function upsertUserFromClerk(clerkUser) {
  const clerkId = normalizeString(clerkUser?.id);
  if (!clerkId) throw new Error("Missing Clerk user ID");

  const incomingEmail = getPrimaryEmail(clerkUser);
  const displayName = getDisplayName(clerkUser);
  const firstName = normalizeString(
    clerkUser.first_name || clerkUser.firstName,
  );
  const lastName = normalizeString(clerkUser.last_name || clerkUser.lastName);
  const imageUrl = normalizeString(clerkUser.image_url || clerkUser.imageUrl);

  const existingUser = await prisma.user.findUnique({
    where: { clerkId },
    include: { profile: true },
  });

  if (!existingUser) {
    // ---------------------------------------------
    // CREATE NEW USER & PROFILE
    // ---------------------------------------------
    const email = incomingEmail || getFallbackEmail(clerkId);
    const createProfileData = buildProfileCreateData(
      clerkUser,
      email,
      displayName,
    );
    const profileData = await createProfileData();

    const newUser = await prisma.user.create({
      data: {
        clerkId,
        email,
        username: profileData.handle.replace(/^@/, ""),
        firstName,
        lastName,
        imageUrl,
        profile: {
          create: profileData,
        },
      },
      include: { profile: true },
    });
    return newUser;
  } else {
    // ---------------------------------------------
    // UPDATE EXISTING USER
    // ---------------------------------------------
    const email = incomingEmail || existingUser.email;
    const createProfileData = buildProfileCreateData(
      clerkUser,
      email,
      displayName,
    );
    const profileData = existingUser.profile ? null : await createProfileData();
    const shouldRefreshProfileIdentity =
      existingUser.profile &&
      (existingUser.profile.name === "Ziele User" ||
        existingUser.profile.avatar === "ZU");
    const updatedUser = await prisma.user.update({
      where: { clerkId },
      data: {
        email,
        username:
          profileData?.handle.replace(/^@/, "") || existingUser.username,
        firstName: firstName || existingUser.firstName,
        lastName: lastName || existingUser.lastName,
        imageUrl: imageUrl || existingUser.imageUrl,
        ...(profileData
          ? {
              profile: {
                create: profileData,
              },
            }
          : shouldRefreshProfileIdentity
            ? {
                profile: {
                  update: {
                    name: displayName,
                    avatar: makeAvatar(displayName),
                  },
                },
              }
          : {}),
      },
      include: { profile: true },
    });

    return updatedUser;
  }
}

export async function patchUserByClerkId(
  clerkId,
  userPatch = {},
  profilePatch = {},
) {
  const id = normalizeString(clerkId);
  if (!id) throw new Error("Missing Clerk user ID");

  let user = await prisma.user.findUnique({ where: { clerkId: id } });
  if (!user) return null;

  if (Object.keys(userPatch).length > 0) {
    user = await prisma.user.update({
      where: { clerkId: id },
      data: userPatch,
      include: { profile: true },
    });
  }

  if (Object.keys(profilePatch).length > 0) {
    await prisma.profile.update({
      where: { clerkId: id },
      data: profilePatch,
    });
  }

  return user;
}

export async function deleteUserByClerkId(clerkId) {
  const id = normalizeString(clerkId);
  if (!id) return false;

  try {
    // Because we use onDelete: Cascade in schema.prisma,
    // deleting the User automatically deletes the Profile!
    await prisma.user.delete({ where: { clerkId: id } });
    return true;
  } catch (err) {
    return false;
  }
}
