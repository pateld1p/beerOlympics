import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';  // Import useRouter from Next.js
import { collection, getDocs } from "firebase/firestore";
import { db } from '../lib/firebase';
import styles from '../styles/Game.module.css';

export default function SelectGame() {
  const router = useRouter();  // Initialize router

  const games = [
    "Keg Relay Race",
    "Beer Pong Gauntlet",
    "Brewskis and Balance",
    "Flip Cup Frenzy",
    "Brewmaster's Challenge",
    "Stein Sprint",
    "Drunken Dodgeball"
  ];

  const [selectedGame, setSelectedGame] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [teamAPlayers, setTeamAPlayers] = useState([]);
  const [teamBPlayers, setTeamBPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);

  // Fetch the players from Firebase and split them by team
  useEffect(() => {
    const fetchPlayers = async () => {
      const querySnapshot = await getDocs(collection(db, "players"));
      const teamA = [];
      const teamB = [];

      querySnapshot.forEach((doc) => {
        const playerData = doc.data();
        if (playerData.team === 'teamA') {
          teamA.push(playerData);
        } else if (playerData.team === 'teamB') {
          teamB.push(playerData);
        }
      });

      // Sort players alphabetically by name
      teamA.sort((a, b) => a.name.localeCompare(b.name));
      teamB.sort((a, b) => a.name.localeCompare(b.name));

      setTeamAPlayers(teamA);
      setTeamBPlayers(teamB);
    };

    fetchPlayers();
  }, []);


  const handleSelectGame = (game) => {
    setSelectedGame(game);
  };

  const handleConfirmGame = () => {
    if (selectedGame) {
      setShowModal(true);  // Open the modal to select players
    }
  };

  const handlePlayerSelection = (player) => {
    if (selectedPlayers.includes(player)) {
      setSelectedPlayers(selectedPlayers.filter((p) => p !== player));
    } else {
      setSelectedPlayers([...selectedPlayers, player]);
    }
  };

  const handleConfirmPlayers = () => {
    // Navigate to the selectwinner page with the game, playersA, and playersB
    router.push({
      pathname: '/selectwinner',
      query: {
        game: selectedGame,
        playersA: JSON.stringify(teamAPlayers.filter(player => selectedPlayers.includes(player.name))),
        playersB: JSON.stringify(teamBPlayers.filter(player => selectedPlayers.includes(player.name))),
      }
    });
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Select a Game</h2>
      <ul className={styles.gameList}>
        {games.map((game, index) => (
          <li
            key={index}
            className={`${styles.gameItem} ${selectedGame === game ? styles.selected : ''}`}  // Apply 'selected' class if selected
            onClick={() => handleSelectGame(game)}  // Handle game selection on click
            onTouchEnd={(e) => {
              e.preventDefault();  // Ensure the touch event is processed
              handleSelectGame(game);  // Handle game selection on touch
            }}
          >
            {game}
          </li>
        ))}
      </ul>
      <button
        className={styles.confirmButton}
        onClick={handleConfirmGame}
        disabled={!selectedGame}
      >
        Confirm Game
      </button>

      {showModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Select Players for {selectedGame}</h3>
            <div className={styles.teamColumns}>
              <div className={styles.teamColumn}>
                <h4>Team A</h4>
                <ul className={styles.playerList}>
                  {teamAPlayers.map((player, index) => (
                    <li key={index}>
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedPlayers.includes(player.name)}
                          onChange={() => handlePlayerSelection(player.name)}
                        />
                        {player.name}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.teamColumn}>
                <h4>Team B</h4>
                <ul className={styles.playerList}>
                  {teamBPlayers.map((player, index) => (
                    <li key={index}>
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedPlayers.includes(player.name)}
                          onChange={() => handlePlayerSelection(player.name)}
                        />
                        {player.name}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <button className={styles.confirmButton} onClick={handleConfirmPlayers}>
              Confirm Players
            </button>
            <button className={styles.cancelButton} onClick={() => setShowModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
