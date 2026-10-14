import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  async headers() {
    return [
      {
        /*
         * 굿즈 사진은 public/에 그대로 두는 파일이라 Next가 "열 때마다 다시 물어보라"는
         * 헤더를 붙인다. 400KB짜리 사진 넉 장을 화면 열 때마다 서버에 확인하게 되는데,
         * 내용이 바뀌면 파일 이름을 바꿔 넣을 것이므로 그 왕복이 통째로 낭비다.
         * 하루 동안 묻지 않고 쓰게 하고, 그 뒤로는 바뀌었는지만 확인하게 둔다.
         */
        source: "/goods/:file*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
