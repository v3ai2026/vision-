
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { GenerationResult, LibraryItem, ModelConfig, GeneratedFile } from "../types";
import { env } from "../lib/env";

const DEFAULT_SYSTEM_INSTRUCTION = `你是一个顶级进化级全栈 AI 编排系统（NovaUI Core）。
你的核心开发准则是：

1. 【极致无障碍与语义化 (A11y-First & Semantic HTML)】：这是最高优先级，不可妥协。
   - 所有生成的 React 组件必须严格遵循 WCAG 2.1 级别 AA 或更高标准。
   - 强制使用语义化 HTML 标签：
     - 使用 <header>, <main>, <footer> 划分页面大区。
     - 使用 <nav> 包裹所有导航链接。
     - 使用 <section> 和 <article> 组织内容块，且每个 section 必须有对应的标题标签 (h2-h6)。
     - 严禁使用 <div> 替代 <a> 或 <button>。
   - 强制 ARIA 属性：
     - 每一个交互元素（Button, Link, Input）必须有明确的 aria-label 或关联的 <label>。
     - 状态变化必须通过 aria-expanded, aria-checked, aria-selected 等属性实时反映。
     - 弹出层（Modal, Tooltip）必须包含 role="dialog" 或 role="tooltip"，并支持 aria-modal="true"。
   - 聚焦管理：所有交互元素必须具备明显的 :focus-visible 样式（建议使用 ring-2 ring-nuxt-green）。
   - 图片准则：所有 <img> 必须有 alt。装饰性图片使用 alt=""，功能性图片必须描述其意图。

2. 【强制自动化测试 (TDD-lite)】：
   - 每一个生成的 UI 组件 (.tsx) 都必须伴随一个同名的测试文件 (.test.tsx)。
   - 使用 Vitest + @testing-library/react + @testing-library/jest-dom。
   - 测试必须包含：
     - 基础渲染测试（Snapshot 或 render 检查）。
     - **无障碍检查**：测试关键元素是否包含正确的 aria-label 和 role。
     - **交互逻辑测试**：模拟点击、输入等事件，验证状态更新。
   - 必须提供全局测试配置文件：\`vitest.config.ts\` 和 \`setupTests.ts\`。

3. 【现代 SaaS 架构与 Vercel 优化】：
   - 采用 Next.js App Router 架构。
   - 所有 API 路由必须标注 \`export const runtime = 'edge';\` 以利用 Vercel Edge Runtime 的低延迟特性。
   - 优化环境变量注入，确保代码在部署后能立即运行。

4. 【深色奢华美学】：使用 Tailwind CSS。采用“深色奢华 (Luxury Dark)”风格，背景 #020420，强调色 #00DC82 (Nuxt Green)。`;

export const generateFullStackProject = async (
  prompt: string, 
  config: ModelConfig,
  customLibrary: LibraryItem[] = [],
  contextShards: string[] = [],
  images: { data: string, mimeType: string }[] = []
): Promise<GenerationResult> => {
  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  const libraryContext = customLibrary.map(item => `- ${item.name}: ${item.description}`).join('\n');
  const vaultContext = contextShards.join('\n\n');

  const textPart = {
    text: `User Intent: ${prompt}

Intelligence Vault Context:
${vaultContext}

Technical Protocols (MANDATORY):
- Project Type: Next.js (App Router) optimized for Vercel.
- Runtime: Vercel Edge Runtime for all API routes.
- Accessibility: 100% A11y compliance. Use semantic tags and full ARIA suites.
- Testing: Mandatory Vitest suite. Generate .test.tsx for EVERY component.
- Vitest Setup: Include vitest.config.ts and setupTests.ts in the root.
- Styling: Tailwind CSS (Luxury Dark + Nuxt Green).
- Design Context: If images are attached, extract colors, typography, and spacing to recreate the design precisely using semantic React components.
- Output Format: Return a complete, build-ready project structure in JSON.`
  };

  const imageParts = images.map(img => ({
    inlineData: {
      data: img.data,
      mimeType: img.mimeType
    }
  }));

  const isThinking = config.thinkingBudget > 0;
  
  const genConfig: any = {
    systemInstruction: `${config.systemInstruction || DEFAULT_SYSTEM_INSTRUCTION}\n\nLibrary protocols:\n${libraryContext}`,
    responseMimeType: "application/json",
    temperature: isThinking ? 1 : config.temperature,
    topP: config.topP,
    topK: config.topK,
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        projectName: { type: Type.STRING },
        files: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              path: { type: Type.STRING },
              content: { type: Type.STRING },
              type: { type: Type.STRING, description: "frontend | backend | test | config" }
            },
            required: ["path", "content", "type"]
          }
        },
        agentLogs: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              agent: { type: Type.STRING },
              action: { type: Type.STRING },
              status: { type: Type.STRING }
            }
          }
        }
      },
      required: ["projectName", "files", "agentLogs"]
    }
  };

  if (isThinking) {
    genConfig.thinkingConfig = { thinkingBudget: 32768 };
  }

  const response = await ai.models.generateContent({
    model: isThinking ? "gemini-3-pro-preview" : "gemini-3-flash-preview",
    contents: { parts: [...imageParts, textPart] },
    config: genConfig
  });

  return JSON.parse(response.text || '{}') as GenerationResult;
};

export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        parts: [
          { inlineData: { data: base64Audio, mimeType } },
          { text: "Transcribe this audio accurately. Output only the transcription text." }
        ]
      }
    ]
  });
  return response.text || "";
};

export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Say this: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Speech synthesis failed");
  return base64Audio;
};

export const convertToColabNotebook = (files: GeneratedFile[], projectName: string): string => {
  const cells: any[] = [
    {
      cell_type: "markdown",
      metadata: {},
      source: [`# ${projectName}\n`, "Generated by IntelliBuild Studio."]
    }
  ];
  files.forEach(file => {
    cells.push({ cell_type: "markdown", metadata: {}, source: [`## File: \`${file.path}\` (\`${file.type}\`)\n`] });
    cells.push({ cell_type: "code", execution_count: null, metadata: {}, outputs: [], source: file.content.split('\n').map(line => line + '\n') });
  });
  return JSON.stringify({ cells, metadata: { kernelspec: { display_name: "Python 3", language: "python", name: "python3" }, language_info: { name: "python", version: "3.8" } }, nbformat: 4, nbformat_minor: 0 }, null, 2);
};
