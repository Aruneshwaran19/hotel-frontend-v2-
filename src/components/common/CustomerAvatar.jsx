import { API_BASE_URL } from "../../config";

const sizeClasses = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-7 h-7 text-xs",
  md: "w-8 h-8 text-xs",
  lg: "w-10 h-10 text-sm",
  xl: "w-16 h-16 text-xl",
};

export default function CustomerAvatar({
  photo,
  name,
  size = "sm",
  className = "",
}) {
  const sizeClass = sizeClasses[size] || sizeClasses.sm;
  const initial = name?.charAt(0)?.toUpperCase() || "?";

  if (photo) {
    const src = photo.startsWith("http") ? photo : `${API_BASE_URL}/${photo}`;
    return (
      <img
        src={src}
        alt={name || "Customer"}
        className={`${sizeClass} rounded-full object-cover shrink-0 shadow-sm ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0 shadow-sm ${className}`}
    >
      {initial}
    </div>
  );
}
