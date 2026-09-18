function parseUserAgent(uaString = "") {
  const ua = uaString || "";

  // Device
  let device = "Desktop";
  if (/iPad|Tablet|PlayBook/i.test(ua)) {
    device = "Tablet";
  } else if (/Mobile|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    device = "Mobile";
  }

  // OS
  let os = "Other";
  if (/Windows NT 10.0|Windows NT 11.0/i.test(ua)) os = "Windows 10/11";
  else if (/Windows/i.test(ua)) os = "Windows";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/Macintosh|Mac OS X/i.test(ua)) os = "macOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  // Browser
  let browser = "Other";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/OPR\/|Opera/i.test(ua)) browser = "Opera";
  else if (/Chrome\/|CriOS\//i.test(ua) && !/Edg\//i.test(ua)) browser = "Chrome";
  else if (/Firefox\/|FxiOS\//i.test(ua)) browser = "Firefox";
  else if (/Version\/.*Safari/i.test(ua) || (/Safari/i.test(ua) && !/Chrome/i.test(ua))) browser = "Safari";

  return { device, os, browser };
}

function cleanIp(rawIp) {
  if (!rawIp) return "127.0.0.1";
  let ip = String(rawIp).trim();
  if (ip.startsWith("::ffff:")) ip = ip.replace("::ffff:", "");
  if (ip === "::1") ip = "127.0.0.1";
  return ip;
}

module.exports = {
  parseUserAgent,
  cleanIp
};
