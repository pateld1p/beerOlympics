import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import styles from '../styles/Scoreboard.module.css';
import { useRouter } from 'next/router';


// team A = Green
// team B = Blue

export default function Scoreboard() {
  const router = useRouter();
  const [teamScores, setTeamScores] = useState({ teamA: 0, teamB: 0 });
  const [playersA, setPlayersA] = useState([]);
  const [playersB, setPlayersB] = useState([]);

  const handleGoBack = () => {
    router.push('/');
  };

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
        updatedPlayersA[playerIndexA].drinks = Math.max(currentDrinksA + change, 0);
        setPlayersA(updatedPlayersA);
        await updateDoc(doc(db, 'players', playerId), { drinks: updatedPlayersA[playerIndexA].drinks });
      } else if (playerIndexB !== -1) {
        const updatedPlayersB = [...playersB];
        const currentDrinksB = updatedPlayersB[playerIndexB].drinks || 0;
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

  // Function to calculate total points for each team
  const calculateTotalPoints = (teamScore, players) => {
    return teamScore + players.reduce((sum, player) => sum + (player.score || 0) + (player.drinks || 0), 0);
  };
  // Sort players alphabetically by name
  const sortedPlayersA = [...playersA].sort((a, b) => a.name.localeCompare(b.name));
  const sortedPlayersB = [...playersB].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className={styles.container}>
      <button onClick={handleGoBack} className={styles.backButton}>Back</button>
      <div className={styles.container}>
        <h1>Scoreboard</h1>
        <div className={styles.teamScores}>
          <h2>Team Green: {teamScores.teamA}</h2>
          <h2>Team Blue: {teamScores.teamB}</h2>
        </div>
        <div className={styles.playersSection}>
          <div className={styles.column}>
            <div className={styles.totalPoints}>
              Total Points: {calculateTotalPoints(teamScores.teamA, sortedPlayersA)}
            </div>
            <ul className={styles.playerList}>
              {sortedPlayersA.map((player) => (
                <li key={`A-${player.id}`} className={styles.playerItem}>
                  <div className={styles.playerInfo}>
                    {player.name} <span className={styles.score}>Score: {player.score || 0}</span>
                  </div>
                  <div className={styles.counter}>
                    <button onClick={() => handleDrinkCountChange(player.id, -1)}>-</button>
                    <span>{player.drinks}</span>
                    <button onClick={() => handleDrinkCountChange(player.id, 1)}>+</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.column}>
            <div className={styles.totalPoints}>
              Total Points: {calculateTotalPoints(teamScores.teamB, sortedPlayersB)}
            </div>
            <ul className={styles.playerList}>
              {sortedPlayersB.map((player) => (
                <li key={`B-${player.id}`} className={styles.playerItem}>
                  <div className={styles.playerInfo}>
                    {player.name} <span className={styles.score}>Score: {player.score || 0}</span>
                  </div>
                  <div className={styles.counter}>
                    <button onClick={() => handleDrinkCountChange(player.id, -1)}>-</button>
                    <span>{player.drinks}</span>
                    <button onClick={() => handleDrinkCountChange(player.id, 1)}>+</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
