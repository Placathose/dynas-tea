import { Button, InlineStack, Thumbnail, BlockStack, Text } from "@shopify/polaris";
import { useRef } from "react";

export default function ImagePicker({ 
  selectedImage, 
  onImageSelect, 
  label = "Image",
  size = "large" 
}) {
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Create a URL for the selected file
      const imageUrl = URL.createObjectURL(file);
      
      const imageData = {
        imageId: `uploaded-${Date.now()}`,
        imageUrl: imageUrl,
        imageAlt: file.name || "Uploaded image",
        imageSource: "upload",
        sourceId: "",
        file: file, // Store the actual file for upload
      };
      
      onImageSelect(imageData);
    }
  };

  const selectImage = () => {
    fileInputRef.current?.click();
  };

  const clearImage = () => {
    onImageSelect({
      imageId: "",
      imageUrl: "",
      imageAlt: "",
      imageSource: "",
      sourceId: "",
      file: null,
    });
  };

  return (
    <BlockStack gap="400">
      <div>
        <div style={{ marginBottom: "8px" }}>
          <strong>{label}</strong>
        </div>
        
        {selectedImage?.imageUrl ? (
          <InlineStack gap="400" align="start">
            <Thumbnail
              source={selectedImage.imageUrl}
              alt={selectedImage.imageAlt || `${label} image`}
              size={size}
            />
            <BlockStack gap="200">
              <div>
                <strong>Selected Image</strong>
                {selectedImage.imageSource === "upload" && (
                  <Text variant="bodySm" color="subdued">
                    Uploaded image
                  </Text>
                )}
              </div>
              <InlineStack gap="200">
                <Button onClick={selectImage} variant="secondary" size="slim">
                  Change image
                </Button>
                <Button onClick={clearImage} variant="plain" size="slim" tone="critical">
                  Remove
                </Button>
              </InlineStack>
            </BlockStack>
          </InlineStack>
        ) : (
          <Button onClick={selectImage} variant="secondary">
            Upload image
          </Button>
        )}
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>
    </BlockStack>
  );
} 