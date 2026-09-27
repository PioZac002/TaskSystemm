import { useEffect, useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatefulButton } from "@/components/ui/StatefulButton";
import { Textarea } from "@/components/ui/Textarea";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { Separator } from "@/components/ui/Separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { useCommentStore } from "@/store/commentStore";
import { useAuthStore } from "@/store/authStore";
import { useUserStore } from "@/store/userStore";
import { storageService } from "@/services/storageService";
import { fileService } from "@/services/fileService";
import { toast } from "sonner";
import { Check, User, Paperclip, X, ImageIcon, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { EditButton } from "@/components/ui/EditButton";
import { DeleteButton } from "@/components/ui/DeleteButton";

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function formatDate(dateString) {
    if (!dateString) return "";

    try {
        const date = new Date(dateString);

        if (isNaN(date.getTime())) {
            return "Invalid date";
        }
        
        // Handle default/unset dates (0001-01-01T00:00:00)
        if (dateString.startsWith("0001-01-01")) {
            return "Just now";
        }

        return date.toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return "Invalid date";
    }
}

function ImageLightbox({ fileIds, initialIndex, onClose }) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [blobUrl, setBlobUrl] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setBlobUrl(null);
        fileService.fetchFileBlob(fileIds[currentIndex])
            .then(url => { if (active) { setBlobUrl(url); setLoading(false); } })
            .catch(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [currentIndex, fileIds]);

    const prev = useCallback(() => setCurrentIndex(i => Math.max(0, i - 1)), []);
    const next = useCallback(() => setCurrentIndex(i => Math.min(fileIds.length - 1, i + 1)), [fileIds.length]);

    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') prev();
            if (e.key === 'ArrowRight') next();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose, prev, next]);

    return (
        <div
            className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
            onClick={onClose}
        >
            {/* Close */}
            <button
                className="absolute top-3 right-3 text-white/80 hover:text-white bg-black/40 rounded-full p-2 z-10"
                onClick={onClose}
            >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            {/* Counter */}
            {fileIds.length > 1 && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 text-white/80 text-sm bg-black/40 rounded-full px-3 py-1 z-10">
                    {currentIndex + 1} / {fileIds.length}
                </div>
            )}

            {/* Prev */}
            {currentIndex > 0 && (
                <button
                    className="absolute left-2 sm:left-4 text-white/80 hover:text-white bg-black/40 rounded-full p-2 sm:p-3 z-10"
                    onClick={(e) => { e.stopPropagation(); prev(); }}
                >
                    <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" />
                </button>
            )}

            {/* Image */}
            <div className="max-w-[90vw] max-h-[85vh] flex items-center justify-center" onClick={e => e.stopPropagation()}>
                {loading ? (
                    <div className="w-16 h-16 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white" />
                    </div>
                ) : blobUrl ? (
                    <img
                        src={blobUrl}
                        alt={`Attachment ${currentIndex + 1}`}
                        className="max-w-[85vw] max-h-[80vh] object-contain rounded-lg shadow-2xl"
                    />
                ) : (
                    <div className="text-white/60 flex flex-col items-center gap-2">
                        <ImageIcon className="h-12 w-12" />
                        <span className="text-sm">Failed to load image</span>
                    </div>
                )}
            </div>

            {/* Next */}
            {currentIndex < fileIds.length - 1 && (
                <button
                    className="absolute right-2 sm:right-4 text-white/80 hover:text-white bg-black/40 rounded-full p-2 sm:p-3 z-10"
                    onClick={(e) => { e.stopPropagation(); next(); }}
                >
                    <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" />
                </button>
            )}
        </div>
    );
}

function AttachmentThumbnail({ fileId, canDelete, onDelete, onClick }) {
    const [blobUrl, setBlobUrl] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        let url = null;
        fileService.fetchFileBlob(fileId)
            .then(u => { url = u; setBlobUrl(u); })
            .catch(() => setError(true));
        return () => { if (url) URL.revokeObjectURL(url); };
    }, [fileId]);

    if (error) {
        return (
            <div className="relative w-20 h-20 rounded-md border border-border bg-muted flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="relative w-20 h-20 rounded-md overflow-hidden border border-border group cursor-pointer">
            {blobUrl ? (
                <img
                    src={blobUrl}
                    alt={`Attachment ${fileId}`}
                    className="w-full h-full object-cover"
                    onClick={onClick}
                />
            ) : (
                <div className="w-full h-full bg-muted animate-pulse" />
            )}
            {/* Zoom overlay */}
            <div
                className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center"
                onClick={onClick}
            >
                <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {canDelete && (
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(fileId); }}
                    className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    title="Delete attachment"
                >
                    <X className="h-3 w-3" />
                </button>
            )}
        </div>
    );
}

export function CommentSection({ issueId }) {
    const [newComment, setNewComment] = useState("");
    const [sortOrder, setSortOrder] = useState("newest");
    const [filterUserId, setFilterUserId] = useState("all");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pendingFiles, setPendingFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [lightbox, setLightbox] = useState(null); // { fileIds, index }
    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState("");
    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);
    const mentionRef = useRef(null);
    const [mentionQuery, setMentionQuery] = useState("");
    const [mentionStart, setMentionStart] = useState(-1);
    const [showMentions, setShowMentions] = useState(false);

    // Pobierz userId z authStore zamiast localStorage
    const user = useAuthStore((state) => state.user);
    const currentUserId = user?.id || null;

    const { comments, fetchCommentsByIssueId, createComment, deleteComment, editComment, uploadAttachment, deleteAttachment, loading } = useCommentStore();
    const { users, fetchUsers } = useUserStore();

    useEffect(() => {
        if (issueId) {
            fetchCommentsByIssueId(issueId);
            fetchUsers();
        }
    }, [issueId, fetchCommentsByIssueId, fetchUsers]);

    useEffect(() => {
        const handler = (e) => {
            if (mentionRef.current && !mentionRef.current.contains(e.target) &&
                textareaRef.current && !textareaRef.current.contains(e.target)) {
                setShowMentions(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Helper function to get user name by ID (fallback when authorName not available)
    const getUserName = (userId) => {
        if (!userId) return "Unknown User";
        const foundUser = users.find(u => u.id === userId);
        if (foundUser) {
            return `${foundUser.firstName || ''} ${foundUser.lastName || ''}`.trim() || `User #${userId}`;
        }
        return `User #${userId}`;
    };

    const getCommentAuthorName = (comment) => {
        if (comment.authorName) return comment.authorName;
        return getUserName(comment.authorId);
    };

    const validateFile = (file) => {
        if (!ALLOWED_TYPES.includes(file.type)) {
            toast.error(`File type not allowed. Use JPG, PNG, or WebP.`);
            return false;
        }
        if (file.size > MAX_FILE_SIZE) {
            toast.error(`File too large. Maximum size is 10MB.`);
            return false;
        }
        return true;
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files || []);
        const valid = files.filter(validateFile);
        if (valid.length > 0) {
            setPendingFiles(prev => [...prev, ...valid]);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handlePaste = (e) => {
        const items = Array.from(e.clipboardData?.items || []);
        const imageItems = items.filter(item => ALLOWED_TYPES.includes(item.type));
        if (imageItems.length === 0) return;
        e.preventDefault();
        const files = imageItems.map(item => item.getAsFile()).filter(Boolean);
        const valid = files.filter(validateFile);
        if (valid.length > 0) {
            setPendingFiles(prev => [...prev, ...valid]);
            toast.success(`${valid.length} image${valid.length > 1 ? 's' : ''} pasted from clipboard`);
        }
    };

    const removePendingFile = (index) => {
        setPendingFiles(prev => prev.filter((_, i) => i !== index));
    };

    const mentionUsers = showMentions
        ? users.filter(u => {
            const full = `${u.firstName} ${u.lastName}`.toLowerCase();
            return mentionQuery === "" || full.includes(mentionQuery.toLowerCase());
        }).slice(0, 6)
        : [];

    const handleCommentChange = (e) => {
        const val = e.target.value;
        const cursor = e.target.selectionStart;
        setNewComment(val);
        const textBeforeCursor = val.slice(0, cursor);
        const match = textBeforeCursor.match(/@(\w*)$/);
        if (match) {
            setMentionQuery(match[1]);
            setMentionStart(cursor - match[0].length);
            setShowMentions(true);
        } else {
            setShowMentions(false);
        }
    };

    const insertMention = (u) => {
        const tag = `@[${u.id}:${u.firstName} ${u.lastName}]`;
        const before = newComment.slice(0, mentionStart);
        const after = newComment.slice(mentionStart + 1 + mentionQuery.length);
        setNewComment(before + tag + after);
        setShowMentions(false);
        textareaRef.current?.focus();
    };

    const renderContent = (text) => {
        const parts = text.split(/(@\[\d+:[^\]]+\])/g);
        return parts.map((part, i) => {
            const match = part.match(/^@\[(\d+):([^\]]+)\]$/);
            if (match) {
                return <span key={i} className="font-bold text-primary">@{match[2]}</span>;
            }
            return part;
        });
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) {
            toast.error("Comment cannot be empty");
            return false;
        }
        
        if (isSubmitting) return false;

        // Spróbuj pobrać userId z różnych źródeł
        let authorId = currentUserId;

        if (!authorId) {
            const storedUserId = storageService.getItem('userId');
            if (storedUserId) {
                authorId = Number(storedUserId);
            }
        }

        if (!authorId) {
            const userStr = storageService.getItem('user');
            if (userStr) {
                try {
                    const userObj = JSON.parse(userStr);
                    authorId = userObj.id;
                } catch (e) {
                    console.error('Error parsing user:', e);
                }
            }
        }

        if (!authorId) {
            toast.error("Unable to identify user. Please try logging in again.");
            return false;
        }

        setIsSubmitting(true);
        try {
            const createdComment = await createComment({
                issueId: Number(issueId),
                content: newComment.trim(),
                authorId: Number(authorId)
            });

            // Upload pending files to the newly created comment
            if (pendingFiles.length > 0 && createdComment?.id) {
                setIsUploading(true);
                for (const file of pendingFiles) {
                    try {
                        await uploadAttachment(file, createdComment.id);
                    } catch (uploadErr) {
                        console.error('Error uploading file:', uploadErr);
                        toast.error(`Failed to upload ${file.name}`);
                    }
                }
                setIsUploading(false);
                setPendingFiles([]);
            }

            toast.success("Comment added successfully!");
            setNewComment("");
            return true;
        } catch (error) {
            const errorMessage = error.response?.data?.Message || error.message || "Failed to add comment";
            toast.error(errorMessage);
            return false;
        } finally {
            setIsSubmitting(false);
            setIsUploading(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm("Are you sure you want to delete this comment?")) return;

        try {
            await deleteComment(commentId);
            toast.success("Comment deleted successfully!");
        } catch (error) {
            const errorMessage = error.response?.data?.Message || error.message || "Failed to delete comment";
            toast.error(errorMessage);
        }
    };

    const handleStartEdit = (comment) => {
        setEditingId(comment.id);
        setEditContent(comment.content);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditContent("");
    };

    const handleSaveEdit = async (commentId) => {
        if (!editContent.trim()) {
            toast.error("Comment cannot be empty");
            return;
        }
        try {
            await editComment(commentId, editContent.trim());
            toast.success("Comment updated!");
            setEditingId(null);
            setEditContent("");
        } catch (error) {
            toast.error(error.response?.data?.Message || error.message || "Failed to edit comment");
        }
    };

    const handleDeleteAttachment = async (fileId, commentId) => {
        if (!window.confirm("Delete this attachment?")) return;
        try {
            await deleteAttachment(fileId, commentId);
            toast.success("Attachment deleted.");
        } catch (attachErr) {
            console.error('Error deleting attachment:', attachErr);
            toast.error("Failed to delete attachment.");
        }
    };

    // Filtrowanie i sortowanie
    let filteredComments = [...comments];

    if (filterUserId !== "all") {
        filteredComments = filteredComments.filter(c => String(c.authorId) === filterUserId);
    }

    filteredComments.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    const uniqueAuthors = [...new Set(comments.map(c => c.authorId))];

    return (
        <div className="space-y-4">
            {/* Filtry */}
            {comments.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-3">
                    <Select value={sortOrder} onValueChange={setSortOrder}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">Newest First</SelectItem>
                            <SelectItem value="oldest">Oldest First</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={filterUserId} onValueChange={setFilterUserId}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Users</SelectItem>
                            {uniqueAuthors.map(authorId => (
                                <SelectItem key={authorId} value={String(authorId)}>
                                    {getUserName(authorId)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Formularz dodawania */}
            <Card className="bg-accent/50">
                <CardContent className="pt-6">
                    <div className="space-y-3">
                        <div className="relative">
                        <Textarea
                            ref={textareaRef}
                            placeholder="Write a comment... (paste images with Ctrl+V, mention with @)"
                            value={newComment}
                            onChange={handleCommentChange}
                            onPaste={handlePaste}
                            rows={3}
                            className="resize-none"
                            disabled={loading || isSubmitting}
                        />
                        {showMentions && mentionUsers.length > 0 && (
                            <div ref={mentionRef} className="absolute z-50 bg-background border rounded-md shadow-lg max-h-40 overflow-y-auto w-56 bottom-full mb-1">
                                {mentionUsers.map(u => (
                                    <button
                                        key={u.id}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2"
                                        onMouseDown={(e) => { e.preventDefault(); insertMention(u); }}
                                    >
                                        <User className="h-3 w-3 shrink-0" />
                                        {u.firstName} {u.lastName}
                                    </button>
                                ))}
                            </div>
                        )}
                        </div>

                        {/* Pending file list */}
                        {pendingFiles.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {pendingFiles.map((file, idx) => (
                                    <div key={idx} className="flex items-center gap-1 bg-muted rounded px-2 py-1 text-sm">
                                        <Paperclip className="h-3 w-3" />
                                        <span className="max-w-[120px] truncate">{file.name}</span>
                                        <button onClick={() => removePendingFile(idx)} className="ml-1 text-muted-foreground hover:text-destructive">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-between items-center">
                            <div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.webp"
                                    multiple
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={loading || isSubmitting}
                                >
                                    <Paperclip className="h-4 w-4 mr-1" />
                                    Attach Image
                                </Button>
                            </div>
                            <StatefulButton
                                onClick={handleAddComment}
                                disabled={loading || isSubmitting || isUploading || !newComment.trim()}
                                loadingText={isUploading ? "Uploading..." : "Adding..."}
                                successText="Added"
                            >
                                Add Comment
                            </StatefulButton>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Lista komentarzy */}
            <div className="space-y-3">
                {loading && comments.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground">Loading comments...</p>
                    </div>
                )}

                {!loading && comments.length === 0 && (
                    <Card className="bg-muted/30">
                        <CardContent className="py-12 text-center">
                            <User className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                            <p className="text-muted-foreground">
                                No comments yet. Be the first to comment!
                            </p>
                        </CardContent>
                    </Card>
                )}

                {!loading && filteredComments.length === 0 && comments.length > 0 && (
                    <Card className="bg-muted/30">
                        <CardContent className="py-8 text-center">
                            <p className="text-muted-foreground">No comments match your filters</p>
                        </CardContent>
                    </Card>
                )}

                {filteredComments.map((comment) => (
                    <Card key={comment.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-4">
                            <div className="flex gap-3">
                                <Avatar className="h-10 w-10 bg-primary/10">
                                    <AvatarFallback className="bg-primary/20 text-primary">
                                        <User className="h-5 w-5" />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                            <p className="font-medium">{getCommentAuthorName(comment)}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDate(comment.createdAt)}
                                            </p>
                                        </div>
                                        {currentUserId === comment.authorId && (
                                            <div className="flex gap-1 items-center">
                                                <EditButton onClick={() => handleStartEdit(comment)} />
                                                <DeleteButton onClick={() => handleDeleteComment(comment.id)} />
                                            </div>
                                        )}
                                    </div>
                                    <Separator className="my-2" />
                                    {editingId === comment.id ? (
                                        <div className="space-y-2">
                                            <Textarea
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                rows={3}
                                                className="resize-none text-sm"
                                                autoFocus
                                            />
                                            <div className="flex gap-2 justify-end">
                                                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                                    <X className="h-3.5 w-3.5 mr-1" />Cancel
                                                </Button>
                                                <Button size="sm" onClick={() => handleSaveEdit(comment.id)}>
                                                    <Check className="h-3.5 w-3.5 mr-1" />Save
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm whitespace-pre-wrap break-words">
                                            {renderContent(comment.content)}
                                        </p>
                                    )}

                                    {/* Attachments */}
                                    {comment.attachmentIds && comment.attachmentIds.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {comment.attachmentIds.map((fileId, idx) => (
                                                <AttachmentThumbnail
                                                    key={fileId}
                                                    fileId={fileId}
                                                    canDelete={currentUserId === comment.authorId}
                                                    onDelete={(id) => handleDeleteAttachment(id, comment.id)}
                                                    onClick={() => setLightbox({ fileIds: comment.attachmentIds, index: idx })}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {lightbox && (
                <ImageLightbox
                    fileIds={lightbox.fileIds}
                    initialIndex={lightbox.index}
                    onClose={() => setLightbox(null)}
                />
            )}
        </div>
    );
}
