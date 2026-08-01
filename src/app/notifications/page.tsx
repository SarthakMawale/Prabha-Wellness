import VanillaPage from '@/components/VanillaPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "PRABHA WELLNESS",
};

const html = "";
const scripts: string[] = [];
const inlineScripts: string[] = [];
const styles: string[] = [];

export default function Page() {
  return (
    <>
      {styles.map((css, i) => <style key={i} dangerouslySetInnerHTML={{ __html: css }} />)}
      <VanillaPage html={html} scripts={scripts} inlineScripts={inlineScripts} />
    </>
  );
}
