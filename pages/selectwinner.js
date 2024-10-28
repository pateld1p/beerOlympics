import { useState, useEffect } from 'react';
import { collection, doc, getDoc, updateDoc, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { db } from '../lib/firebase';
import { useRouter } from 'next/router';
import styles from '../styles/Game.module.css';

export default function SelectWinner() {
  const router = useRouter();
  const { game, playersA, playersB } = router.query;
  const [winner, setWinner] = useState(null);
  const [gameData, setGameData] = useState(null); // Store individual and team points for the game

  const playersAList = playersA ? JSON.parse(playersA) : [];
  const playersBList = playersB ? JSON.parse(playersB) : [];

  useEffect(() => {
    const fetchGameData = async () => {
      if (game) {
        const gameRef = doc(db, "selectGame", game); // Get game data from Firestore
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

  const updatePlayerScores = async (players, individualPoints) => {
    try {
      for (const player of players) {
        const playersRef = collection(db, "players");
        const q = query(playersRef, where("name", "==", player.name));
        const querySnapshot = await getDocs(q);
  
        querySnapshot.forEach(async (doc) => {
          const currentScore = doc.data().score || 0;
          await updateDoc(doc.ref, {
            score: currentScore + individualPoints,
          });
          console.log(`${player.name}'s score updated to ${currentScore + individualPoints}`);
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
      await updatePlayerScores(playersAList, individualPoints);
      await updatePlayerScores(playersBList, individualPoints);

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
          onTouchEnd={(e) => {
            e.preventDefault();
            handleWinnerSelection('Team A');
          }}
        >
          Team A
        </button>
        <button
          className={`${styles.teamButton} ${winner === 'Team B' ? styles.selected : ''}`}
          onClick={() => handleWinnerSelection('Team B')}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleWinnerSelection('Team B');
          }}
        >
          Team B
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
