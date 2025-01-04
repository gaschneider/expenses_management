import React, { useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField
} from "@mui/material";

interface AddCommentModalProps {
  open: boolean;
  comment: string;
  setComment: (comment: string) => void;
  actionToTriggerAfterComment: React.MutableRefObject<
    ((comment?: string) => Promise<void>) | undefined
  >;
  setIsAddCommentModalOpen: (isOpen: boolean) => void;
}

export const AddCommentModal: React.FC<AddCommentModalProps> = ({
  open,
  comment,
  setComment,
  actionToTriggerAfterComment,
  setIsAddCommentModalOpen
}) => {
  const handleClose = useCallback(() => {
    setIsAddCommentModalOpen(false);
    actionToTriggerAfterComment.current = undefined;
    setComment("");
  }, [actionToTriggerAfterComment, setComment, setIsAddCommentModalOpen]);

  const handleProceed = useCallback(async () => {
    if (actionToTriggerAfterComment.current) {
      await actionToTriggerAfterComment.current(comment);
    }
    handleClose();
  }, [actionToTriggerAfterComment, comment, handleClose]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Comment</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          margin="normal"
          label="Comment"
          multiline
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          autoFocus
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleProceed}
          variant="contained"
          style={{ backgroundColor: "green", color: "white" }}
        >
          Proceed
        </Button>
        <Button
          onClick={handleClose}
          variant="contained"
          style={{ backgroundColor: "red", color: "white" }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
