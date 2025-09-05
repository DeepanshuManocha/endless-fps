import { useRef } from "react";
import Ground from "./entities/Ground";
import Boundaries from "./entities/Boundaries";
import Player from "./entities/Player";
import Gun from "./entities/Gun";

export default function Game() {
  const playerPosRef = useRef<[number, number, number]>([0, 1, 0]);

  return (
    <>
      <Ground />
      <Boundaries />
      <Player posRef={playerPosRef} />
      <Gun playerPosRef={playerPosRef} />
    </>
  );
}
