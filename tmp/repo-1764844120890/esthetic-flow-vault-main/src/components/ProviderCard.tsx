import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MapPin, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProviderCardProps {
  provider: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
    avatar_url?: string;
    specialties?: string[];
    bio?: string;
    clinic_name?: string;
  };
  showBooking?: boolean;
}

export const ProviderCard = ({ provider, showBooking = false }: ProviderCardProps) => {
  const initials = provider.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardTitle className="text-lg">Your Provider</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Provider Photo */}
          <Avatar className="w-24 h-24 ring-4 ring-primary/20">
            <AvatarImage src={provider.avatar_url} alt={provider.full_name} />
            <AvatarFallback className="text-2xl bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Provider Info */}
          <div className="space-y-2">
            <h3 className="font-semibold text-xl">{provider.full_name}</h3>
            {provider.clinic_name && (
              <p className="text-sm text-muted-foreground">{provider.clinic_name}</p>
            )}
            {provider.specialties && provider.specialties.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {provider.specialties.map((specialty, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {specialty}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Bio */}
          {provider.bio && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {provider.bio}
            </p>
          )}

          {/* Contact Actions */}
          <div className="w-full space-y-2 pt-2">
            {provider.phone && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.location.href = `tel:${provider.phone}`}
              >
                <Phone className="w-4 h-4 mr-2" />
                {provider.phone}
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() =>
                window.location.href = `mailto:${provider.email}?subject=Patient Portal Question`
              }
            >
              <Mail className="w-4 h-4 mr-2" />
              Email Doctor
            </Button>
            {showBooking && (
              <Button className="w-full" variant="default">
                <Calendar className="w-4 h-4 mr-2" />
                Book Appointment
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
