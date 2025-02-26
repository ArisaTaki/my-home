// 使用ESM语法
import fs from "fs";
import { execSync } from "child_process";

// 获取Git提交记录
function getCommitLogs() {
  try {
    // 获取最近20条提交记录
    const logs = execSync(
      'git log -20 --pretty=format:"%s" | grep -v "版本" | grep -v "测试"',
    ).toString();

    // 分析提交消息
    const newFeatures = [];
    const fixes = [];

    logs.split("\n").forEach((commit) => {
      if (commit.match(/新增|添加|feat|feature|new/i)) {
        const message = commit.replace(/^.*:\s*/, "").trim();
        if (message) newFeatures.push(message);
      } else if (commit.match(/修复|fix|bug|修正|订正/i)) {
        const message = commit.replace(/^.*:\s*/, "").trim();
        if (message) fixes.push(message);
      }
    });

    return { new: newFeatures, fix: fixes };
  } catch (error) {
    console.error("获取Git提交记录时出错:", error);
    return { new: [], fix: [] };
  }
}

// 生成更新日志文件
function generateChangelogFile() {
  const changelog = getCommitLogs();

  // 创建目录（如果不存在）
  if (!fs.existsSync("src/data")) {
    fs.mkdirSync("src/data", { recursive: true });
  }

  // 写入文件
  fs.writeFileSync("src/data/changelog.json", JSON.stringify(changelog, null, 2));

  console.log("更新日志已生成!");
}

generateChangelogFile();
