'use client';

/**
 * CustomHome — developer homepage override.
 *
 * When `NEXT_PUBLIC_HOME_PAGE_ENABLED=true`, `/` will render this component
 * instead of the feed or the default landing. Edit this file freely — you
 * can use Three.js, Framer Motion, Lottie, or any client library here
 * because this is a normal Next.js Client Component inside the app shell
 * (header stays, content is injected).
 *
 * If this file is deleted or you set `NEXT_PUBLIC_HOME_PAGE_ENABLED=false`,
 * `/` will fall back automatically: CustomHome → DefaultHome → feed.
 *
 * This placeholder just re-exports DefaultHome. Replace it with your own
 * design.
 */
export { default } from './DefaultHome';
