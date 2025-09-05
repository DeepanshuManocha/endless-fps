import Ground from "./entities/Ground";
import Boundaries from "./entities/Boundaries";
import Player from "./entities/Player";

export default function Game() {
  return (
    <>
      <Ground />
      <Boundaries />
      <Player />
    </>
  );
}
