import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import {
  createComment,
  deleteComment,
  getCurrentProfile,
  getPostComments,
} from "../lib/apiClient";
import { formatCompactNumber } from "../lib/formatters";
import { GuestPopup, useGuestGuard } from "./GuestGuard";
import "./CommentSection.css";

/* ── Author avatar: photo → letter fallback ───────────────────── */
function CommentAvatar({ src, name }) {
  const [imgError, setImgError] = React.useState(false);
  const letter = (name || "?").charAt(0).toUpperCase();
  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name}
        className="comment-author-avatar"
        onError={() => setImgError(true)}
        style={{ borderRadius: "50%", objectFit: "cover" }}
      />
    );
  }
  return <div className="comment-author-avatar">{letter}</div>;
}

function CommentSection({ postId }) {
  const { isSignedIn } = useAuth();
  const guard = useGuestGuard();

  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState("");
  const [currentProfile, setCurrentProfile] = useState(null);
  const inputRef = useRef(null);

  const fetchComments = useCallback(async () => {
    const data = await getPostComments(postId);
    setComments(data);
  }, [postId]);

  useEffect(() => {
    fetchComments().catch((err) => {
      setError(err.message || "Unable to load comments.");
    });
  }, [fetchComments]);

  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;
    getCurrentProfile()
      .then((profile) => { if (!cancelled) setCurrentProfile(profile || null); })
      .catch(() => { if (!cancelled) setCurrentProfile(null); });
    return () => { cancelled = true; };
  }, [isSignedIn]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isSignedIn) { guard.showPopup(); return; }
    if (!newCommentText.trim() || isPosting) return;

    setIsPosting(true);
    setError("");
    try {
      await createComment(postId, {
        authorName: currentProfile?.name || "You",
        authorHandle: currentProfile?.handle || "@currentuser",
        avatar: currentProfile?.avatar || "Y",
        content: newCommentText.trim(),
      });
      setNewCommentText("");
      await fetchComments();
    } catch (err) {
      setError(err.message || "Unable to post comment.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      try {
        await deleteComment(id);
        await fetchComments();
      } catch (err) {
        setError(err.message || "Unable to delete comment.");
      }
    }
  };

  return (
    <section className="comment-section" id="comments">
      <GuestPopup
        visible={guard.popupVisible}
        isAnimating={guard.isAnimating}
        onClose={guard.hidePopup}
      />

      <div className="comment-header">
        <h3 className="comment-count-title">
          {formatCompactNumber(comments.length)}{" "}
          {comments.length === 1 ? "Comment" : "Comments"}
        </h3>
      </div>

      {/* Comment input — shows guest prompt if not signed in */}
      {isSignedIn ? (
        <form onSubmit={handleSubmit} className="comment-input-form">
          <div className="comment-input-wrapper">
            <textarea
              ref={inputRef}
              placeholder="Add to the conversation..."
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              disabled={isPosting}
              rows={1}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = e.target.scrollHeight + "px";
              }}
            />
            <div className="comment-input-actions">
              <button
                type="submit"
                className={`comment-submit-btn ${newCommentText.trim() ? "active" : ""}`}
                disabled={!newCommentText.trim() || isPosting}
              >
                {isPosting ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <button
          type="button"
          className="comment-guest-cta"
          onClick={guard.showPopup}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Sign in to join the conversation
        </button>
      )}

      {error ? (
        <div className="comment-empty-state">
          <p>{error}</p>
        </div>
      ) : null}

      <div className="comment-list">
        {comments.length === 0 ? (
          <div className="comment-empty-state">
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <CommentAvatar
                src={comment.authorPhotoUrl || comment.avatarUrl}
                name={comment.authorName || comment.authorHandle}
              />
              <div className="comment-main">
                <div className="comment-author-row">
                  <span className="comment-author-name">{comment.authorName}</span>
                  <span className="comment-author-handle">{comment.authorHandle}</span>
                  <span className="comment-dot">•</span>
                  <span className="comment-time">{comment.time}</span>

                  {(comment.authorHandle === "@currentuser" ||
                    (currentProfile?.handle &&
                      comment.authorHandle === currentProfile.handle) ||
                    (currentProfile?.id && comment.profileId === currentProfile.id)) && (
                    <button
                      className="comment-delete-btn"
                      onClick={() => handleDelete(comment.id)}
                      title="Delete comment"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                      </svg>
                    </button>
                  )}
                </div>
                <p className="comment-content">{comment.content}</p>
                <div className="comment-actions">
                  <button
                    className="comment-action-link"
                    onClick={() => !isSignedIn && guard.showPopup()}
                  >
                    Like
                  </button>
                  <button
                    className="comment-action-link"
                    onClick={() => !isSignedIn && guard.showPopup()}
                  >
                    Reply
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default CommentSection;
