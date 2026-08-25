import { processPdfAsync } from "@firecrawl/pdf-inspector";

export const markdownFilesFromPdfsInDir = async (dir: URL) => {
  for await (const { isFile, name } of Deno.readDir(dir)) {
    if (isFile && name.endsWith(".pdf")) {
      const url = new URL(name, dir);
      const result = await processPdfAsync(
        await Deno.readFile(url) as Buffer,
      );
      if (result && result.markdown) {
        const mdFileUrl = new URL(url.href.replace(/.pdf$/i, ".md"));
        await Deno.writeTextFile(mdFileUrl, result.markdown);
      }
    }
  }
};
