import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import styles from '../styles/Scoreboard.module.css';

export default function Scoreboard() {
  const [teamScores, setTeamScores] = useState({ teamA: 0, teamB: 0 });
  const [playersA, setPlayersA] = useState([]);
  const [playersB, setPlayersB] = useState([]);
  const [newScores, setNewScores] = useState({}); // To hold new score input for players


  useEffect(() => {
    const fetchScores = async () => {
      // Fetch team scores
      const teamsSnapshot = await getDocs(collection(db, 'teams'));
      let teamA = 0, teamB = 0;
      teamsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (doc.id === 'Team A') {
          teamA = data.points || 0;
        } else if (doc.id === 'Team B') {
          teamB = data.points || 0;
        }
      });
      setTeamScores({ teamA, teamB });

      // Fetch player scores
      const playersSnapshot = await getDocs(collection(db, 'players'));
      const playersAData = [];
      const playersBData = [];
      playersSnapshot.forEach((doc) => {
        const playerData = doc.data();
        if (playerData.team === 'teamA') {
          playersAData.push(playerData);
        } else if (playerData.team === 'teamB') {
          playersBData.push(playerData);
        }
      });
      setPlayersA(playersAData);
      setPlayersB(playersBData);
    };

    fetchScores();
  }, []);

  return (
    <div className={styles.container}>
      <h1>Scoreboard</h1>
      <div className={styles.teamScores}>
        <h2>Team A: {teamScores.teamA}</h2>
        <h2>Team B: {teamScores.teamB}</h2>
      </div>
      <div className={styles.playersSection}>
        <div className={styles.column}>
          <h3>Team A Players</h3>
          <ul className={styles.playerList}>
            {playersA.map((player, index) => (
              <li key={index}>
                {player.name} : {player.score || 0}
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.column}>
          <h3>Team B Players</h3>
          <ul className={styles.playerList}>
            {playersB.map((player, index) => (
              <li key={index}>
                {player.name} : {player.score || 0}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}