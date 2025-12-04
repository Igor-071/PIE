import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider";

interface PhotoGalleryProps {
  beforePhotos: string[];
  afterPhotos: string[];
  treatmentDate: string;
  treatmentType: string;
}

export const PhotoGallery = ({
  beforePhotos,
  afterPhotos,
  treatmentDate,
  treatmentType,
}: PhotoGalleryProps) => {
  const [showGallery, setShowGallery] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const hasPhotos = beforePhotos.length > 0 || afterPhotos.length > 0;
  const pairCount = Math.max(beforePhotos.length, afterPhotos.length);

  if (!hasPhotos) return null;

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? pairCount - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === pairCount - 1 ? 0 : prev + 1));
  };

  return (
    <>
      {/* Thumbnail Preview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              📸 Progress Photos
            </Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(treatmentDate).toLocaleDateString()}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowGallery(true)}
            className="text-primary hover:text-primary/90"
          >
            <Maximize2 className="w-4 h-4 mr-1" />
            View
          </Button>
        </div>

        {/* Mini Before/After Preview */}
        {beforePhotos[0] && afterPhotos[0] && (
          <div className="relative overflow-hidden rounded-lg cursor-pointer group" onClick={() => setShowGallery(true)}>
            <ReactCompareSlider
              itemOne={
                <ReactCompareSliderImage
                  src={beforePhotos[0]}
                  alt="Before"
                  className="w-full h-48 object-cover"
                />
              }
              itemTwo={
                <ReactCompareSliderImage
                  src={afterPhotos[0]}
                  alt="After"
                  className="w-full h-48 object-cover"
                />
              }
              position={50}
              className="h-48"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white font-medium">Click to view full gallery</span>
            </div>
          </div>
        )}
      </div>

      {/* Full Gallery Modal */}
      {showGallery && (
        <>
          <div
            className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50"
            onClick={() => setShowGallery(false)}
          />
          <Card className="fixed inset-4 md:inset-8 z-50 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between bg-card">
              <div>
                <h3 className="font-semibold text-lg">{treatmentType}</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(treatmentDate).toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowGallery(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <CardContent className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-hidden">
              {beforePhotos[currentIndex] && afterPhotos[currentIndex] ? (
                <div className="w-full max-w-4xl">
                  <ReactCompareSlider
                    itemOne={
                      <div className="relative w-full h-full">
                        <ReactCompareSliderImage
                          src={beforePhotos[currentIndex]}
                          alt="Before"
                          className="w-full h-[60vh] object-contain"
                        />
                        <Badge
                          variant="secondary"
                          className="absolute top-4 left-4 bg-background/80 backdrop-blur"
                        >
                          Before
                        </Badge>
                      </div>
                    }
                    itemTwo={
                      <div className="relative w-full h-full">
                        <ReactCompareSliderImage
                          src={afterPhotos[currentIndex]}
                          alt="After"
                          className="w-full h-[60vh] object-contain"
                        />
                        <Badge
                          variant="default"
                          className="absolute top-4 right-4 bg-primary/90 backdrop-blur"
                        >
                          After
                        </Badge>
                      </div>
                    }
                    position={50}
                    className="h-[60vh] rounded-lg overflow-hidden"
                  />
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  No photo available
                </div>
              )}
            </CardContent>

            {/* Navigation */}
            {pairCount > 1 && (
              <div className="p-4 border-t flex items-center justify-between bg-card">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentIndex + 1} / {pairCount}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </Card>
        </>
      )}
    </>
  );
};
