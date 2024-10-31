import { useState, useEffect } from 'react';
import { collection, doc, getDoc, updateDoc, addDoc, serverTimestamp, query, where, getDocs, setDoc } from "firebase/firestore";
import { db } from '../lib/firebase';
import { useRouter } from 'next/router';
import styles from '../styles/Game.module.css';

// team A = Green
// team B = Blue

export default function SelectWinner() {
  const router = useRouter();
  const { game, playersA, playersB } = router.query;
  const [winner, setWinner] = useState(null);
  const [gameData, setGameData] = useState(null);

  const playersAList = playersA ? JSON.parse(playersA) : [];
  const playersBList = playersB ? JSON.parse(playersB) : [];

  useEffect(() => {
    const fetchGameData = async () => {
      if (game) {
        const gameRef = doc(db, "selectGame", game); // Fetch game data from Firestore
        const gameSnapshot = await getDoc(gameRef);
        if (gameSnapshot.exists()) {
          setGameData(gameSnapshot.data());
        } else {
          console.error("Game data not found!");
        }
      }
    };
    fetchGameData();
  }, [game]);

  const handleWinnerSelection = (team) => {
    setWinner(team);
  };

  const updateTeamPoints = async (team, points) => {
    try {
      const teamRef = doc(db, "teams", team);
      const teamSnapshot = await getDoc(teamRef);
      if (teamSnapshot.exists()) {
        const currentPoints = teamSnapshot.data().points || 0;
        await updateDoc(teamRef, {
          points: currentPoints + points,
        });
        console.log(`${team} points updated to ${currentPoints + points}`);
      } else {
        console.log("Team not found");
      }
    } catch (error) {
      console.error("Error updating team points: ", error);
    }
  };

  const updatePlayerScores = async (players, gameName, individualPoints) => {
    try {
      for (const player of players) {
        const playersRef = collection(db, "players");
        const q = query(playersRef, where("name", "==", player.name));
        const querySnapshot = await getDocs(q);
  
        querySnapshot.forEach(async (playerDoc) => {
          const currentScore = playerDoc.data().score || 0;
          await updateDoc(playerDoc.ref, {
            score: currentScore + individualPoints,
          });
          console.log(`${player.name}'s cumulative score updated to ${currentScore + individualPoints}`);
  
          const gameRef = doc(db, "players", playerDoc.id, "games", gameName);
  
          // Ensure the game document exists in the player's 'games' subcollection with an initial score of 0
          await setDoc(gameRef, { score: 0 }, { merge: true });
  
          // Fetch the game document's current score after ensuring it exists
          const gameSnapshot = await getDoc(gameRef);
          const currentGameScore = gameSnapshot.exists() ? gameSnapshot.data().score : 0;
  
          // Update the score for the specific game by adding individual points
          await updateDoc(gameRef, {
            score: currentGameScore + individualPoints,
          });
  
          console.log(`${player.name}'s score for ${gameName} updated to ${currentGameScore + individualPoints}`);
        });
      }
    } catch (error) {
      console.error("Error updating player scores: ", error);
    }
  };

  const handleConfirmWinner = async () => {
    if (!winner || !gameData) return;

    try {
      // Save the game result
      await addDoc(collection(db, "games"), {
        game: game,
        playersA: playersAList,
        playersB: playersBList,
        timestamp: serverTimestamp(),
        winner: winner,
      });

      // Award individual points to both teams' players
      const { individualPoints, teamPoints } = gameData;
      await updatePlayerScores(playersAList, game, individualPoints);
      await updatePlayerScores(playersBList, game, individualPoints);

      // Update team points only for the winning team
      if (winner === "Team A") {
        await updateTeamPoints("Team A", teamPoints);
      } else if (winner === "Team B") {
        await updateTeamPoints("Team B", teamPoints);
      }

      alert(`The winner has been recorded! ${winner} is the winning team.`);
      router.push('/');
    } catch (error) {
      console.error('Error saving the game result:', error);
      alert('Error occurred while saving the result. Please try again.');
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Select the Winning Team for {game}</h2>

      <div className={styles.playersSection}>
        <div className={styles.teamPlayers}>
          <h3>Team Green Players</h3>
          <ul className={styles.playerList}>
            {playersAList.map((player, index) => (
              <li key={index}>{player.name}</li>  
            ))}
          </ul>
        </div>

        <div className={styles.teamPlayers}>
          <h3>Team Blue Players</h3>
          <ul className={styles.playerList}>
            {playersBList.map((player, index) => (
              <li key={index}>{player.name}</li>  
            ))}
          </ul>
        </div>
      </div>

      <div className={styles.teams}>
        <button
          className={`${styles.teamButton} ${winner === 'Team A' ? styles.selected : ''}`}
          onClick={() => handleWinnerSelection('Team A')}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleWinnerSelection('Team A');
          }}
        >
          Team Green
        </button>
        <button
          className={`${styles.teamButton} ${winner === 'Team B' ? styles.selected : ''}`}
          onClick={() => handleWinnerSelection('Team B')}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleWinnerSelection('Team B');
          }}
        >
          Team Blue
        </button>
      </div>

      <button
        className={styles.confirmButton}
        onClick={handleConfirmWinner}
        disabled={!winner || !gameData} // Disable until gameData is fetched
      >
        Confirm Winner
      </button>
    </div>
  );
}
