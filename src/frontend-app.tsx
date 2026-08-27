import { render } from "preact";
import type { SpindleFrontendContext } from "lumiverse-spindle-types";
import jumpscareImage from "./assets/jumpscare.jpg";
import jumpscareAudio from "./assets/jumpscare.mp3";
import { LumiWhyyyRuntime } from "./runtime";
import { Dashboard } from "./ui/dashboard";
import { LUMI_WHYYY_ICON } from "./ui/icons";
import { LUMI_WHYYY_CSS } from "./ui/styles";

export function setup(ctx: SpindleFrontendContext): () => void {
  ctx.deferReady();
  const removeStyle = ctx.dom.addStyle(LUMI_WHYYY_CSS);
  const drawer = ctx.ui.registerDrawerTab({
    id: "control-room",
    title: "LumiWHYYY",
    shortName: "WHYYY",
    headerTitle: "LumiWHYYY",
    description: "Configure a recurring fullscreen Foxy jumpscare.",
    keywords: ["foxy", "jumpscare", "timer", "why", "fnaf"],
    iconSvg: LUMI_WHYYY_ICON,
  });
  const runtime = new LumiWhyyyRuntime(ctx, jumpscareImage, jumpscareAudio);
  render(<Dashboard runtime={runtime} imageUrl={jumpscareImage} />, drawer.root);
  runtime.start();
  ctx.ready();

  return () => {
    runtime.destroy();
    render(null, drawer.root);
    drawer.destroy();
    removeStyle();
  };
}

