"use client";

export function LogoutButton() {
  return (
    <button
      type="button"
      className="secondary"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/login";
      }}
    >
      登出
    </button>
  );
}
