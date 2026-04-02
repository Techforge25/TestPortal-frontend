"use client";

type AdminBrandingSettings = {
  companyName: string;
  logoDataUrl: string;
};

type AdminProfileSettings = {
  name: string;
  avatarDataUrl: string;
};

export const defaultBranding: AdminBrandingSettings = {
  companyName: "Techforge Innovation",
  logoDataUrl: "/assest/images/40.png",
};

export const defaultProfile: AdminProfileSettings = {
  name: "Sara Khan",
  avatarDataUrl: "/assets/images/profile.png",
};

export function useAdminBranding() {
  return defaultBranding;
}

export function usePublicBranding() {
  return defaultBranding;
}

export function useAdminProfile() {
  return defaultProfile;
}
