import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to get fetch options, including credentials if needed
export function getFetchOptions(options?: RequestInit): RequestInit {
  const baseOptions: RequestInit = { ...options };

  // Check if running in Cloud Workstations environment
  // NEXT_PUBLIC_ variables are exposed to the browser
  const isCloudWorkstation = process.env.NEXT_PUBLIC_IS_CLOUD_WORKSTATION === 'true';

  if (isCloudWorkstation) {
    // Log that we're adding credentials (for debugging)
    // console.log('Running in Cloud Workstation: Adding credentials: "include" to fetch options.');
    baseOptions.credentials = 'include';
  } else {
    // Log that we're not adding credentials (for debugging)
    // console.log('Not running in Cloud Workstation: Not adding credentials to fetch options.');
    // Optionally, you might want to set credentials to 'same-origin' or omit it for local dev
    // baseOptions.credentials = 'same-origin'; // Default behavior if omitted usually
  }

  return baseOptions;
}
