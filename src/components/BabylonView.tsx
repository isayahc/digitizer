import React, { useEffect, useRef } from 'react';
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Animation,
  ActionManager,
  ExecuteCodeAction,
} from '@babylonjs/core';
import { MechScene, MechPart } from '../services/geminiService';

interface BabylonViewProps {
  data: MechScene | null;
}

const BabylonView: React.FC<BabylonViewProps> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new Engine(canvasRef.current, true);
    engineRef.current = engine;

    const scene = new Scene(engine);
    sceneRef.current = scene;
    scene.clearColor = new Color3(0.1, 0.1, 0.1).toColor4();

    const camera = new ArcRotateCamera(
      'camera',
      Math.PI / 4,
      Math.PI / 3,
      10,
      Vector3.Zero(),
      scene
    );
    camera.attachControl(canvasRef.current, true);
    camera.wheelPrecision = 50;

    const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    engine.runRenderLoop(() => {
      scene.render();
    });

    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.dispose();
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current || !data) return;

    const scene = sceneRef.current;
    
    // Clear existing meshes except camera/lights
    scene.meshes.slice().forEach((m) => {
      if (m.name !== 'camera' && m.name !== 'light') {
        m.dispose();
      }
    });

    data.parts.forEach((part, index) => {
      let mesh;
      const name = `${part.name}_${index}`;

      switch (part.type) {
        case 'box':
          mesh = MeshBuilder.CreateBox(name, {
            width: part.scaling.x,
            height: part.scaling.y,
            depth: part.scaling.z,
          }, scene);
          break;
        case 'cylinder':
          mesh = MeshBuilder.CreateCylinder(name, {
            diameter: part.scaling.x,
            height: part.scaling.y,
          }, scene);
          break;
        case 'sphere':
          mesh = MeshBuilder.CreateSphere(name, {
            diameter: part.scaling.x,
          }, scene);
          break;
        case 'torus':
          mesh = MeshBuilder.CreateTorus(name, {
            diameter: part.scaling.x,
            thickness: part.scaling.y,
          }, scene);
          break;
        case 'gear':
          // Simplified gear as a cylinder with some "teeth" logic or just a torus
          mesh = MeshBuilder.CreateCylinder(name, {
            diameter: part.scaling.x,
            height: part.scaling.y,
            tessellation: 12,
          }, scene);
          break;
        default:
          mesh = MeshBuilder.CreateBox(name, {}, scene);
      }

      mesh.position = new Vector3(part.position.x, part.position.y, part.position.z);
      mesh.rotation = new Vector3(part.rotation.x, part.rotation.y, part.rotation.z);
      
      const material = new StandardMaterial(`${name}_mat`, scene);
      material.diffuseColor = Color3.FromHexString(part.color || '#cccccc');
      material.specularColor = new Color3(0.5, 0.5, 0.5);
      mesh.material = material;

      // Animation
      if (part.animation) {
        const frameRate = 30;
        const animation = new Animation(
          `${name}_anim`,
          part.animation.property,
          frameRate,
          Animation.ANIMATIONTYPE_FLOAT,
          Animation.ANIMATIONLOOPMODE_CYCLE
        );

        const keyFrames = [];
        keyFrames.push({
          frame: 0,
          value: mesh.rotation.y, // Default start
        });

        if (part.animation.property.includes('rotation')) {
           keyFrames.push({
            frame: frameRate,
            value: mesh.rotation.y + Math.PI * 2 * (part.animation.speed || 1),
          });
        } else if (part.animation.property.includes('position')) {
           keyFrames.push({
            frame: frameRate / 2,
            value: mesh.position.y + (part.animation.speed || 1),
          });
          keyFrames.push({
            frame: frameRate,
            value: mesh.position.y,
          });
        }

        animation.setKeys(keyFrames);
        mesh.animations.push(animation);
        scene.beginAnimation(mesh, 0, frameRate, true);
      }
    });

    // Adjust camera to fit
    if (data.parts.length > 0) {
        const camera = scene.activeCamera as ArcRotateCamera;
        camera.setTarget(Vector3.Zero());
    }

  }, [data]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden rounded-xl border border-white/10 shadow-2xl">
      <canvas ref={canvasRef} className="w-full h-full outline-none" />
      {!data && (
        <div className="absolute inset-0 flex items-center justify-center text-white/30 font-mono text-sm uppercase tracking-widest">
          Waiting for reconstruction...
        </div>
      )}
    </div>
  );
};

export default BabylonView;
