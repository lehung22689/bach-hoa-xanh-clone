/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/sales', // <-- Thêm dòng này để Next.js hiểu nó nằm trong subfolder
};
export default nextConfig;