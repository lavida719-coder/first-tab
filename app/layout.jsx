import './style.css';

export const metadata = { title: '첫 탭', description: '나만의 브라우저 시작 페이지' };

export default function Layout({ children }) {
  return <html lang="ko"><body>{children}</body></html>;
}
