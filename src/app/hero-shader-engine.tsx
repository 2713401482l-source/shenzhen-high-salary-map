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
      <FilmGrain strength={0.05} bias={2} animated>
        <FlutedGlass aberration={0.61} angle={31} frequency={8} highlight={0.12} highlightSoftness={0} highlightColor="#ffffff" lightAngle={-90} refraction={4} shape="rounded" softness={1} speed={0.15} waveAmplitude={0.06} waveFrequency={1.5} edges="mirror">
          <ChromaFlow baseColor="#ffffff" downColor="#ff5f03" leftColor="#ff5f03" rightColor="#ff5f03" upColor="#ff5f03" momentum={13} radius={3.5} intensity={1}>
            <Swirl colorA="#ffffff" colorB="#f0f0f0" detail={1.7} speed={0.25} blend={46} colorSpace="linear" />
          </ChromaFlow>
        </FlutedGlass>
      </FilmGrain>
    </Shader>
  </ShaderBoundary>;
}
