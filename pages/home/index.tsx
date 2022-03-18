import Head from "next/head";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex h-screen bg-black">
      <Head>
        <title>Platforms on Vercel</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Link href="/app" passHref>
        <a className="m-auto w-48" rel="noreferrer noopener">
          <Image
            width={512}
            height={512}
            src="/logo.png"
            alt="Platforms on Vercel"
          />
        </a>
      </Link>
    </div>
  );
}
