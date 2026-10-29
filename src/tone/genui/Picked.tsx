// Gerado de toneorg/extension@568dac5bb6b0 (packages/genui-react/src/Picked.tsx). Não edite aqui.
// The product the person picked in the conversation, above the composer: a
// thumbnail, its name, its videos and a way to let it go. The next message
// carries it, so "is this one good for running?" needs no name.
import type { PickedProduct } from "@/tone/shared";
import { useState } from "react";
import { safeImage } from "./host";
import { Icon } from "./Icon";

export function PickedProductBar(props: {
  product: PickedProduct;
  storeHosts: readonly string[];
  busy: boolean;
  onVideos: () => void;
  onRemove: () => void;
}) {
  const { product } = props;
  const [broken, setBroken] = useState(false);
  const image = broken ? null : safeImage(product.image, props.storeHosts);
  return (
    <section className="picked" aria-label="Produto selecionado">
      {image ? (
        <img className="thumb sm" src={image} alt="" referrerPolicy="no-referrer" onError={() => setBroken(true)} />
      ) : (
        <div className="thumb sm" aria-hidden="true" />
      )}
      <div className="picked-text">
        <span className="small muted">Falando deste produto</span>
        <span className="picked-title" title={product.title}>
          {product.title}
        </span>
      </div>
      <button type="button" className="btn outline sm" onClick={props.onVideos} disabled={props.busy}>
        <Icon name="play" size={16} /> Ver vídeos
      </button>
      <button type="button" className="icon-btn" aria-label="Tirar o produto da conversa" onClick={props.onRemove}>
        <Icon name="close" size={18} />
      </button>
    </section>
  );
}
