import React from 'react';
import {ChromaFlow, FilmGrain, FlutedGlass, Shader} from 'shaders/react';

class ShaderBoundary extends React.Component<{children: React.ReactNode}, {failed: boolean}> {
  state = {failed: false};
  static getDerivedStateFromError() { return {failed: true}; }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function HeroShaderScene() {
  return <ShaderBoundary>
    <Shader className="hero-shader hero-shader-interactive" disableTelemetry toneMapping="neutral">
      <FilmGrain strength={0.045} bias={2} animated>
        <FlutedGlass aberration={0.92} angle={31} frequency={11} highlight={0.42} highlightSoftness={0.12} highlightColor="#ffffff" lightAngle={-82} refraction={4} shape="rounded" softness={0.7} speed={0.24} waveAmplitude={0.11} waveFrequency={1.8} edges="mirror">
          <ChromaFlow baseColor="#fffaf7" downColor="#ff3d00" leftColor="#ff006e" rightColor="#ff6a00" upColor="#5b2cff" momentum={18} radius={4.2} intensity={1.38} />
        </FlutedGlass>
      </FilmGrain>
    </Shader>
  </ShaderBoundary>;
}
