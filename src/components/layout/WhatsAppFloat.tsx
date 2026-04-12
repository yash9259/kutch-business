import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const WHATSAPP_NUMBER = "918780254591";
const WHATSAPP_MESSAGE = "hello i want to apply for the job";

const WhatsAppFloat = () => {
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50">
      <Button asChild className="rounded-full shadow-card px-4 motion-safe:animate-bounce [animation-duration:2.2s] hover:animate-none">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="Chat on WhatsApp"
          title="Chat on WhatsApp"
        >
          <MessageCircle className="h-4 w-4" />
          <span>WhatsApp</span>
        </a>
      </Button>
    </div>
  );
};

export default WhatsAppFloat;
