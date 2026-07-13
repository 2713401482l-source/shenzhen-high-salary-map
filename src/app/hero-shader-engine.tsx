import React from 'react';
import {ChromaFlow, FilmGrain, FlutedGlass, Shader, Swirl} from 'shaders/react';

class ShaderBoundary extends React.Component<{children: React.ReactNode}, {failed: boolean}> {
  state = {failed: false};
  static getDerivedStateFromError() { return {failed: true}; }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function HeroShaderScene() {
  return <ShaderBoundary>
    <Shader className="hero-shader" disableTelemetry toneMapping="neutral">
      <FilmGrain strength={0.045} bias={2} animated>
        <FlutedGlass aberration={1.05} angle={31} frequency={16} highlight={0.34} highlightSoftness={0.08} highlightColor="#ffffff" lightAngle={-82} refraction={8.5} shape="rounded" softness={0.72} speed={0.24} waveAmplitude={0.11} waveFrequency={1.8} edges="mirror">
          <ChromaFlow baseColor="#fffaf7" downColor="#ff3d00" leftColor="#ff006e" rightColor="#ff6a00" upColor="#5b2cff" momentum={18} radius={4.2} intensity={1.38}>
            <Swirl colorA="#fff8f2" colorB="#d7cbff" detail={2.4} speed={0.38} blend={58} colorSpace="linear" />
          </ChromaFlow>
        </FlutedGlass>
      </FilmGrain>
    </Shader>
  </ShaderBoundary>;
}
