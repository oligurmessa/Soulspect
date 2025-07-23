import * as fs from "fs";
import * as path from "path";


// Get arguments
const [,, SRC, DEST] = process.argv;
if (!SRC || !DEST) {
  console.error("Usage: node move_editor.js <src_dir> <dest_dir>");
  process.exit(1);
}

// Recursively copy all files/folders from src to dest
function copyRecursiveSync(src: string, dest: string) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    if (fs.lstatSync(srcPath).isDirectory()) {
      copyRecursiveSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Update imports in .ts/.tsx files to use '@/components/editor' as root
function updateImportsInDir(dir: string, oldRoot: string, newRoot: string) {
  for (const entry of fs.readdirSync(dir)) {
    const entryPath = path.join(dir, entry);
    if (fs.lstatSync(entryPath).isDirectory()) {
      updateImportsInDir(entryPath, oldRoot, newRoot);
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry)) {
      let content = fs.readFileSync(entryPath, "utf-8");
      // Update relative imports from oldRoot to newRoot alias (if your project supports it)
      const relImportPattern = new RegExp(
        `(['"\`])${escapeForRegExp(oldRoot)}\\/`,
        "g"
      );
      content = content.replace(relImportPattern, `$1${newRoot}/`);
      fs.writeFileSync(entryPath, content);
    }
  }
}

function escapeForRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ---- MAIN ----
console.log(`Copying ${SRC} -> ${DEST}`);
copyRecursiveSync(SRC, DEST);
console.log("Copy complete. Updating import paths...");

// You may want to use '@/components/editor' or a relative path (adjust as needed)
updateImportsInDir(DEST, SRC, "@/components/editor");

console.log("Done. All files moved and imports updated.");