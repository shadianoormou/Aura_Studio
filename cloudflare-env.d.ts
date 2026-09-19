declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    MEDIA?: R2Bucket;
    ADMIN_PIN?: string;
    RESEND_API_KEY?: string;
    CONTACT_EMAIL?: string;
    CONTACT_FROM_EMAIL?: string;
  }
}
