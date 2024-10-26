import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from '../lib/firebase';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [teamA, setTeamA] = useState([]);
  const [teamB, setTeamB] = useState([]);
  const [playerNameA, setPlayerNameA] = useState(""); // Separate state for Team A input
  const [playerNameB, setPlayerNameB] = useState(""); // Separate state for Team B input

  // Fetch players from Firebase
  useEffect(() => {
    const fetchPlayers = async () => {
      const querySnapshot = await getDocs(collection(db, "players"));
      const teamAPlayers = [];
      const teamBPlayers = [];

      querySnapshot.forEach((doc) => {
        const playerData = doc.data();
        if (playerData.team === "teamA") {
          teamAPlayers.push(playerData.name);
        } else {
          teamBPlayers.push(playerData.name);
        }
      });

      // Sort player names alphabetically
      teamAPlayers.sort();
      teamBPlayers.sort();

      setTeamA(teamAPlayers);
      setTeamB(teamBPlayers);
    };

    fetchPlayers();
  }, []);


  const handleAddPlayerA = async () => {
    if (!playerNameA) return;
    setTeamA([...teamA, playerNameA]);

    try {
      await addDoc(collection(db, "players"), {
        name: playerNameA,
        team: "teamA",
        score: 0
      });
    } catch (e) {
      console.error("Error adding player: ", e);
    }

    setPlayerNameA("");
  };

  const handleAddPlayerB = async () => {
    if (!playerNameB) return;
    setTeamB([...teamB, playerNameB]);

    try {
      await addDoc(collection(db, "players"), {
        name: playerNameB,
        team: "teamB",
        score: 0
      });
    } catch (e) {
      console.error("Error adding player: ", e);
    }

    setPlayerNameB("");
  };

  return (
    <div className={styles.container}>
      <div className={styles.teams}>
        <div className={styles.teamColumn}>
          <h2 className={styles.teamTitle}>Team A</h2>
          <ul className={styles.playerList}>
            {teamA.map((player, index) => <li key={index} className={styles.playerItem}>{player}</li>)}
          </ul>
          <div className={styles.addPlayer}>
            <input
              type="text"
              value={playerNameA}
              onChange={(e) => setPlayerNameA(e.target.value)}
              placeholder="Enter player name"
              className={styles.playerInput}
            />
            <button
              onClick={handleAddPlayerA}
              className={playerNameA ? styles.addButtonActive : styles.addButtonDisabled} // Conditional styling
              disabled={!playerNameA}
            >
              Add Player +
            </button>
          </div>
        </div>

        <div className={styles.teamColumn}>
          <h2 className={styles.teamTitle}>Team B</h2>
          <ul className={styles.playerList}>
            {teamB.map((player, index) => <li key={index} className={styles.playerItem}>{player}</li>)}
          </ul>
          <div className={styles.addPlayer}>
            <input
              type="text"
              value={playerNameB}
              onChange={(e) => setPlayerNameB(e.target.value)}
              placeholder="Enter player name"
              className={styles.playerInput}
            />
            <button
              onClick={handleAddPlayerB}
              className={playerNameB ? styles.addButtonActive : styles.addButtonDisabled} // Conditional styling
              disabled={!playerNameB}
            >
              Add Player +
            </button>
          </div>
        </div>
      </div>
      <div className={styles.selectGameWrapper}>
        <a href="/selectgame" className={styles.selectGameButton}>Select Game</a>
        <a href="/scoreboard" className={styles.scoreboardButton}>Scoreboard</a>
      </div>
    </div>
  );
}