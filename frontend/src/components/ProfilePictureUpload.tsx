import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/notify";
import api from "@/api/axios";

interface ProfilePictureUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes

const ProfilePictureUpload = ({
  isOpen,
  onClose,
  onSuccess,
}: ProfilePictureUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      notify.error("File size must not exceed 2MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      notify.error("Please select a valid image file");
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("profile_picture", selectedFile);

      await api.post("/api/user/profile-picture", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      notify.success("Profile picture updated successfully!");
      resetForm();
      onSuccess?.();
      onClose();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to upload profile picture";
      notify.error(message);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setPreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Upload Profile Picture</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-muted rounded transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Upload Area */}
        <div className="space-y-4">
          {/* Preview or Upload Area */}
          {preview ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-border flex items-center justify-center">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedFile?.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile!.size / 1024).toFixed(2)} KB
              </p>
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, GIF up to 2MB
                </p>
              </div>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            aria-label="Select profile picture"
          />

          {/* File Size Info */}
          <p className="text-xs text-muted-foreground text-center">
            Maximum file size: 2MB
          </p>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={uploading}
            >
              Cancel
            </Button>
            {preview ? (
              <>
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                  disabled={uploading}
                >
                  Choose Different
                </Button>
                <Button
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </>
            ) : (
              <Button
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => fileInputRef.current?.click()}
              >
                Select Image
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePictureUpload;
