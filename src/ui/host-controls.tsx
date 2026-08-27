import type {
  SpindleFrontendContext,
  SpindleNumberStepperHandle,
  SpindleRangeSliderHandle,
  SpindleSelectHandle,
  SpindleSwitchHandle,
} from "lumiverse-spindle-types";
import { useEffect, useRef } from "preact/hooks";

export function HostSwitch(props: {
  ctx: SpindleFrontendContext;
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange(value: boolean): void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const handle = useRef<SpindleSwitchHandle | null>(null);
  const latest = useRef(props);
  latest.current = props;
  useEffect(() => {
    if (!root.current) return;
    handle.current = props.ctx.components.mountSwitch(root.current, {
      checked: props.checked,
      disabled: props.disabled,
      size: "md",
      ariaLabel: props.label,
      onChange: (value) => latest.current.onChange(value),
    });
    return () => {
      handle.current?.destroy();
      handle.current = null;
    };
  }, [props.ctx]);
  useEffect(() => handle.current?.update({
    checked: props.checked,
    disabled: props.disabled,
    ariaLabel: props.label,
  }), [props.checked, props.disabled, props.label]);
  return <div class="lw-host-control lw-switch" ref={root} />;
}

export function HostNumber(props: {
  ctx: SpindleFrontendContext;
  value: number;
  step: number;
  disabled?: boolean;
  onChange(value: number): void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const handle = useRef<SpindleNumberStepperHandle | null>(null);
  const latest = useRef(props);
  latest.current = props;
  useEffect(() => {
    if (!root.current) return;
    handle.current = props.ctx.components.mountNumberStepper(root.current, {
      value: props.value,
      step: props.step,
      disabled: props.disabled,
      onChange: (value) => {
        if (value !== null) latest.current.onChange(value);
      },
    });
    return () => {
      handle.current?.destroy();
      handle.current = null;
    };
  }, [props.ctx]);
  useEffect(() => handle.current?.update({
    value: props.value,
    step: props.step,
    disabled: props.disabled,
  }), [props.value, props.step, props.disabled]);
  return <div class="lw-host-control" ref={root} />;
}

export function HostUnitSelect(props: {
  ctx: SpindleFrontendContext;
  value: string;
  disabled?: boolean;
  onChange(value: string): void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const handle = useRef<SpindleSelectHandle | null>(null);
  const latest = useRef(props);
  latest.current = props;
  useEffect(() => {
    if (!root.current) return;
    handle.current = props.ctx.components.mountSelect(root.current, {
      value: props.value,
      options: [
        { value: "seconds", label: "Seconds" },
        { value: "minutes", label: "Minutes" },
        { value: "hours", label: "Hours" },
      ],
      searchThreshold: 99,
      portal: true,
      disabled: props.disabled,
      ariaLabel: "Interval unit",
      onChange: (value) => latest.current.onChange(value),
    });
    return () => {
      handle.current?.destroy();
      handle.current = null;
    };
  }, [props.ctx]);
  useEffect(() => handle.current?.update({
    value: props.value,
    disabled: props.disabled,
  }), [props.value, props.disabled]);
  return <div class="lw-host-control" ref={root} />;
}

export function HostVolume(props: {
  ctx: SpindleFrontendContext;
  value: number;
  disabled?: boolean;
  onChange(value: number): void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const handle = useRef<SpindleRangeSliderHandle | null>(null);
  const latest = useRef(props);
  latest.current = props;
  useEffect(() => {
    if (!root.current) return;
    handle.current = props.ctx.components.mountRangeSlider(root.current, {
      label: "Volume",
      hint: "Applied immediately to the supplied MP3.",
      value: props.value,
      min: 0,
      max: 100,
      step: 5,
      integer: true,
      format: { suffix: "%" },
      disabled: props.disabled,
      onCommit: (value) => latest.current.onChange(value),
    });
    return () => {
      handle.current?.destroy();
      handle.current = null;
    };
  }, [props.ctx]);
  useEffect(() => handle.current?.update({
    value: props.value,
    disabled: props.disabled,
  }), [props.value, props.disabled]);
  return <div class="lw-host-control lw-volume" ref={root} />;
}

export function HostSpeed(props: {
  ctx: SpindleFrontendContext;
  value: number;
  disabled?: boolean;
  onChange(value: number): void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const handle = useRef<SpindleRangeSliderHandle | null>(null);
  const latest = useRef(props);
  latest.current = props;
  useEffect(() => {
    if (!root.current) return;
    handle.current = props.ctx.components.mountRangeSlider(root.current, {
      label: "Playback speed",
      hint: "Changes the pitch and duration of current and future scares.",
      value: props.value,
      min: 0.25,
      max: 4,
      step: 0.25,
      format: { decimals: 2, suffix: "×" },
      disabled: props.disabled,
      onCommit: (value) => latest.current.onChange(value),
    });
    return () => {
      handle.current?.destroy();
      handle.current = null;
    };
  }, [props.ctx]);
  useEffect(() => handle.current?.update({
    value: props.value,
    disabled: props.disabled,
  }), [props.value, props.disabled]);
  return <div class="lw-host-control lw-speed" ref={root} />;
}
