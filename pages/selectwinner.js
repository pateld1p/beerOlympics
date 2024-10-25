import { useState, useEffect } from 'react';
import { collection, doc, getDoc, updateDoc, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { db } from '../lib/firebase';
import { useRouter } from 'next/router';
import styles from '../styles/Game.module.css';

export default function SelectWinner() {
  const router = useRouter();
  const { game, playersA, playersB } = router.query; // Get the game name, players from query params
  const [winner, setWinner] = useState(null);

  const playersAList = playersA ? JSON.parse(playersA) : [];
  const playersBList = playersB ? JSON.parse(playersB) : [];

  const handleWinnerSelection = (team) => {
    setWinner(team);
  };

  const updateTeamPoints = async (team) => {
    try {
      // Reference to the team's document
      const teamRef = doc(db, "teams", team);

      // Fetch the current points for the team
      const teamSnapshot = await getDoc(teamRef);
      if (teamSnapshot.exists()) {
        const currentPoints = teamSnapshot.data().points || 0;

        // Increment the points by 1
        await updateDoc(teamRef, {
          points: currentPoints + 1,
        });

        console.log(`${team} points updated to ${currentPoints + 1}`);
      } else {
        console.log("Team not found");
      }
    } catch (error) {
      console.error("Error updating team points: ", error);
    }
  };

  const updatePlayerScores = async (players, team) => {
    try {
      for (const player of players) {
        // Query Firestore to find the player document by name
        const playersRef = collection(db, "players");
        const q = query(playersRef, where("name", "==", player.name));
        const querySnapshot = await getDocs(q);
  
        querySnapshot.forEach(async (doc) => {
          // For each player document, fetch the current score and increment it
          const currentScore = doc.data().score || 0;
          await updateDoc(doc.ref, {
            score: currentScore + 1, // Increment the score by 1
          });
          console.log(`${player.name}'s score updated to ${currentScore + 1}`);
        });
      }
    } catch (error) {
      console.error("Error updating player scores: ", error);
    }
  };

  const handleConfirmWinner = async () => {
    if (!winner) return;
  
    try {
      // Save the game result
      await addDoc(collection(db, "games"), {
        game: game,
        playersA: playersAList,
        playersB: playersBList,
        timestamp: serverTimestamp(),
        winner: winner,
      });
  
      // Update the winning team's points
      await updateTeamPoints(winner);
  
      // Update individual player scores
      if (winner === "Team A") {
        await updatePlayerScores(playersAList, "A");
      } else if (winner === "Team B") {
        await updatePlayerScores(playersBList, "B");
      }
  
      // Display an alert after the winner is confirmed
      alert(`The winner has been recorded! ${winner} is the winning team.`);
  
      // Redirect to homepage after the alert
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
          <h3>Team A Players</h3>
          <ul className={styles.playerList}>
            {playersAList.map((player, index) => (
              <li key={index}>{player.name}</li>  
            ))}
          </ul>
        </div>

        <div className={styles.teamPlayers}>
          <h3>Team B Players</h3>
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
        >
          Team A
        </button>
        <button
          className={`${styles.teamButton} ${winner === 'Team B' ? styles.selected : ''}`}
          onClick={() => handleWinnerSelection('Team B')}
        >
          Team B
        </button>
      </div>
      
      <button
        className={styles.confirmButton}
        onClick={handleConfirmWinner}
        disabled={!winner}
      >
        Confirm Winner
      </button>
    </div>
  );
}
