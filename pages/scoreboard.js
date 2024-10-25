import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import styles from '../styles/Scoreboard.module.css';

export default function Scoreboard() {
  const [teamScores, setTeamScores] = useState({ teamA: 0, teamB: 0 });
  const [playersA, setPlayersA] = useState([]);
  const [playersB, setPlayersB] = useState([]);

  useEffect(() => {
    const fetchScores = async () => {
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

      const playersSnapshot = await getDocs(collection(db, 'players'));
      const playersAData = [];
      const playersBData = [];
      playersSnapshot.forEach((doc) => {
        const playerData = doc.data();
        playerData.id = doc.id;
        playerData.drinks = playerData.drinks || 0;
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

  const handleDrinkCountChange = async (playerId, change) => {
    if (!playerId) {
      console.error("Invalid player ID:", playerId);
      return;
    }
  
    try {
      const playerIndexA = playersA.findIndex(player => player.id === playerId);
      const playerIndexB = playersB.findIndex(player => player.id === playerId);
  
      if (playerIndexA !== -1) {
        const updatedPlayersA = [...playersA];
        const currentDrinksA = updatedPlayersA[playerIndexA].drinks || 0;
        
        // Check to avoid negative drinks count
        updatedPlayersA[playerIndexA].drinks = Math.max(currentDrinksA + change, 0);
        setPlayersA(updatedPlayersA);
        await updateDoc(doc(db, 'players', playerId), { drinks: updatedPlayersA[playerIndexA].drinks });
      } else if (playerIndexB !== -1) {
        const updatedPlayersB = [...playersB];
        const currentDrinksB = updatedPlayersB[playerIndexB].drinks || 0;
  
        // Check to avoid negative drinks count
        updatedPlayersB[playerIndexB].drinks = Math.max(currentDrinksB + change, 0);
        setPlayersB(updatedPlayersB);
        await updateDoc(doc(db, 'players', playerId), { drinks: updatedPlayersB[playerIndexB].drinks });
      } else {
        console.error("Player not found in either team.");
      }
    } catch (error) {
      console.error('Error updating drinks count:', error);
    }
  };
  

  const handleResetScore = async (team) => {
    const confirmation = window.confirm(`Are you sure you want to reset all scores for Team ${team}?`);
    if (!confirmation) return;
  
    try {
      const updatedPlayers = team === 'teamA' ? [...playersA] : [...playersB];
  
      // Debug: Log players to be reset
      console.log(`Resetting scores for players in ${team}:`, updatedPlayers);
  
      // Reset player scores to 0
      for (let player of updatedPlayers) {
        player.score = 0; // Reset score in local state
        await updateDoc(doc(db, 'players', player.id), { score: 0 }); // Update Firestore
      }
  
      // Reset team score to 0 in Firestore
      await updateDoc(doc(db, 'teams', `Team ${team}`), { points: 0 });
  
      // Update local state after resetting
      if (team === 'teamA') {
        setPlayersA(updatedPlayers); // Update playersA in state
        setTeamScores(prevScores => ({ ...prevScores, teamA: 0 })); // Reset teamA score
      } else {
        setPlayersB(updatedPlayers); // Update playersB in state
        setTeamScores(prevScores => ({ ...prevScores, teamB: 0 })); // Reset teamB score
      }
  
      alert(`Team ${team} scores have been reset.`);
    } catch (error) {
      console.error('Error resetting scores:', error);
    }
  };  
  

  // Sort players by score in descending order
  const sortedPlayersA = [...playersA].sort((a, b) => (b.score || 0) - (a.score || 0));
  const sortedPlayersB = [...playersB].sort((a, b) => (b.score || 0) - (a.score || 0));

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
            {sortedPlayersA.map((player) => (
              <li key={`A-${player.id}`} className={styles.playerItem}>
                <div className={styles.playerInfo}>
                  {player.name}<span className={styles.score}>Score: {player.score || 0}</span>
                </div>
                <div className={styles.counter}>
                  <button onClick={() => handleDrinkCountChange(player.id, -1)}>-</button>
                  <span>{player.drinks}</span>
                  <button onClick={() => handleDrinkCountChange(player.id, 1)}>+</button>
                </div>
              </li>
            ))}
          </ul>
          <button onClick={() => handleResetScore('A')} className={styles.resetButton}>Reset Team A Scores</button>
        </div>

        <div className={styles.column}>
          <h3>Team B Players</h3>
          <ul className={styles.playerList}>
            {sortedPlayersB.map((player) => (
              <li key={`B-${player.id}`} className={styles.playerItem}>
                <div className={styles.playerInfo}>
                  {player.name}<span className={styles.score}>Score: {player.score || 0}</span>
                </div>
                <div className={styles.counter}>
                  <button onClick={() => handleDrinkCountChange(player.id, -1)}>-</button>
                  <span>{player.drinks}</span>
                  <button onClick={() => handleDrinkCountChange(player.id, 1)}>+</button>
                </div>
              </li>
            ))}
          </ul>
          <button onClick={() => handleResetScore('B')} className={styles.resetButton}>Reset Team B Scores</button>
        </div>
      </div>
    </div>
  );
}
