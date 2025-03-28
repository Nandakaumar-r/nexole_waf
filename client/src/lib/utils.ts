import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// IP Geolocation data interface
export interface IpGeolocationData {
  status: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
  mobile: boolean;
  proxy: boolean;
  hosting: boolean;
}

/**
 * Fetches geolocation data for an IP address using ip-api.com
 * @param ip - The IP address to lookup
 * @returns Promise with geolocation data
 */
export async function getIpGeolocation(ip: string): Promise<IpGeolocationData> {
  try {
    const response = await fetch(`/api/geo/ip-location?ip=${encodeURIComponent(ip)}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to fetch geolocation data: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching IP geolocation:", error);
    throw error;
  }
}

/**
 * Checks if an IP address is valid
 * @param ip - The IP address to validate
 * @returns boolean indicating if IP is valid
 */
export function isValidIpAddress(ip: string): boolean {
  // IPv4 regex pattern
  const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  
  if (!ipv4Pattern.test(ip)) {
    return false;
  }
  
  // Check that each number is between 0-255
  const octets = ip.split('.');
  for (let i = 0; i < octets.length; i++) {
    const num = parseInt(octets[i], 10);
    if (num < 0 || num > 255) {
      return false;
    }
  }
  
  return true;
}
