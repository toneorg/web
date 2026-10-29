// Gerado de toneorg/extension@568dac5bb6b0 (packages/genui-react/src/AssistantMessage.tsx). Não edite aqui.
// An answer of the assistant: its text in a bubble, and each OpenUI Lang block
// drawn with the library, progressively while it streams. The library comes
// from the same definitions the server teaches the model (packages/shared/src/genui.ts).
import { createLibrary, defineComponent, type ParseResult, Renderer } from "@openuidev/react-lang";
import { GENUI_COMPONENTS, GENUI_ROOT, splitAnswer } from "@/tone/shared/genui";
import { useState } from "react";
import { RENDERERS } from "./components";
import { GenUIContext, type GenUIHost } from "./host";

export const library = createLibrary({
  id: "tone",
  root: GENUI_ROOT,
  components: GENUI_COMPONENTS.map((spec) =>
    defineComponent({
      name: spec.name,
      description: spec.description,
      props: spec.props,
      // Each drawing reads the props of its own schema; every component has one (checked in the tests).
      component: RENDERERS[spec.name] as never,
    }),
  ),
});

/** One OpenUI Lang block of an answer, drawn while it streams. Needs a GenUIContext above it. */
export function GenUIBlock(props: { code: string; streaming: boolean }) {
  const [result, setResult] = useState<ParseResult | null>(null);
  const failed = !props.streaming && !result?.root;
  if (failed && result !== null) {
    return <p className="notice">Não consegui desenhar esta parte da resposta.</p>;
  }
  return (
    <Renderer
      response={props.code}
      library={library}
      isStreaming={props.streaming}
      onParseResult={setResult}
      publishObservability={false}
    />
  );
}

export function AssistantMessage(props: { text: string; streaming: boolean; greeting?: boolean; host: GenUIHost }) {
  const parts = splitAnswer(props.text);
  return (
    <GenUIContext.Provider value={props.host}>
      {parts.map((part, index) =>
        part.kind === "text" ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: the parts of one answer only grow at the end.
          <div key={index} className={`msg assistant${props.greeting && index === 0 ? " greeting" : ""}`}>
            {part.text}
          </div>
        ) : (
          // biome-ignore lint/suspicious/noArrayIndexKey: as above.
          <GenUIBlock key={index} code={part.code} streaming={props.streaming && !part.complete} />
        ),
      )}
    </GenUIContext.Provider>
  );
}
