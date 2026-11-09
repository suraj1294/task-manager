import Image from "next/image";

import { cn } from "@/lib/utils";
import { getFileUrl } from "@/lib/files";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ProjectAvatarProps {
  image?: string;
  name: string;
  className?: string;
  fallbackClassName?: string;
};

export const ProjectAvatar = ({
  image,
  name,
  className,
  fallbackClassName,
}: ProjectAvatarProps) => {
  const src = getFileUrl(image);

  if (src) {
    return (
      <div className={cn(
        "size-5 relative rounded-md overflow-hidden",
        className,
      )}>
        <Image src={src} alt={name} fill unoptimized className="object-cover" />
      </div>
    );
  }

  return (
    <Avatar className={cn("size-5 rounded-md", className)}>
      <AvatarFallback className={cn(
        "text-white bg-blue-600 font-semibold text-sm uppercase rounded-md",
        fallbackClassName,
      )}>
        {name[0]}
      </AvatarFallback>
    </Avatar>
  );
};
