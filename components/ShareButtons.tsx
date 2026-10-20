'use client';
export default function ShareButtons({ login }: { login: string }) {
  return <div className="share" data-login={login} />;
}
