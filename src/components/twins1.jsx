import React, { useState, useEffect } from "react";

const Twins1 = () => {
  // Enhanced column count for different screen widths
  const getColumnsForScreenWidth = () => {
    if (window.innerWidth <= 480) return 4; // Small mobile: 4 columns
    if (window.innerWidth <= 767) return 5; // Large mobile/small tablet: 5 columns
    if (window.innerWidth <= 1023) return 6; // Tablet: 6 columns
    if (window.innerWidth <= 1279) return 7; // Small desktop: 7 columns
    return 8; // Large desktop: 8 columns
  };

  const COLORS = {
    background: "#0E0E0E", // Almost black background
    primary: "#FFC472", // Yellow-orange accent color
    secondary: "#2A5095", // Blue accent
    tertiary: "#22c55e", // Green accent
    highlight: "#FED296", // Lighter yellow for highlights/focus states
    buttonText: "#0E0E0E", // Dark text for buttons
  };

  const NAME_DISPLAY_DURATION = 500;

  // Game configuration constants
  const [columns, setColumns] = useState(getColumnsForScreenWidth());
  const [pairCount, setPairCount] = useState(16); // Default 16 pairs
  const TOTAL_PAIRS = pairCount;
  //const TOTAL_PAIRS = Math.floor((ROWS * columns) / 2);
  const ROWS = Math.ceil((TOTAL_PAIRS * 2) / columns);
  const CARD_STATES = {
    COVER: "cover",
    OPEN: "open",
    MATCHED: "matched",
  };

  // Game state variables
  const playAgainButtonRef = React.useRef(null);

  const [cardData, setCardData] = useState({});
  const [availableCardKeys, setAvailableCardKeys] = useState([]);
  const [cards, setCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [openCard, setOpenCard] = useState(null);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [matchEffectCards, setMatchEffectCards] = useState([]);
  const [congratsScale, setCongratsScale] = useState(0.3);
  const [congratsOpacity, setCongratsOpacity] = useState(0);
  const [isProcessingClick, setIsProcessingClick] = useState(false);

  // Add this debugging console log to verify breakpoints during development
  useEffect(() => {
    const handleResize = () => {
      const newColumns = getColumnsForScreenWidth();
      console.log(
        `Screen width: ${window.innerWidth}px → ${newColumns} columns`
      );
      setColumns(newColumns);
    };

    // Initial log
    console.log(
      `Initial screen width: ${
        window.innerWidth
      }px → ${getColumnsForScreenWidth()} columns`
    );

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Adjust your card margin/gap for better spacing with more columns

  // Load card data from JSON file
  useEffect(() => {
    const loadCardData = async () => {
      try {
        setIsLoading(true);
        // Use the correct path for card-data.json
        const response = await fetch(
          `${import.meta.env.BASE_URL}card-data.json`
        );

        if (!response.ok) {
          throw new Error(
            `Failed to load card data (status: ${response.status})`
          );
        }

        const data = await response.json();

        setCardData(data);
        setAvailableCardKeys(Object.keys(data));
      } catch (error) {
        console.error("Error loading card data:", error);

        // Automatically generate fallback data with card numbers
        const generateFallbackData = () => {
          const fallbackData = {};
          // Generate 20 cards by default, or adjust based on your needs
          for (let i = 1; i <= 20; i++) {
            fallbackData[`card${i}`] = `Card ${i}`;
          }
          return fallbackData;
        };

        const fallbackData = generateFallbackData();
        console.log("Using fallback card data:", fallbackData);
        setCardData(fallbackData);
        setAvailableCardKeys(Object.keys(fallbackData));
      } finally {
        setIsLoading(false);
      }
    };
    loadCardData();
  }, []);

  // Initialize game with card data
  const initializeGame = () => {
    if (availableCardKeys.length === 0) {
      console.error("No card data available");
      return;
    }

    setOpenCard(null);
    setMatchedPairs(0);
    setIsGameOver(false);
    setGameStarted(true);

    // Shuffle and select random cards
    const shuffledKeys = [...availableCardKeys].sort(() => Math.random() - 0.5);
    const selectedKeys = shuffledKeys.slice(0, TOTAL_PAIRS);

    // Create card pairs
    let newCards = [];
    //let cardNumber = 1;
    selectedKeys.forEach((key, index) => {
      // Card data includes the key (for file lookup) and the display name from JSON
      const cardInfo = {
        key: key,
        displayName: cardData[key],
      };

      // Create two cards with the same image/data
      const card1 = {
        id: index * 2,
        sourceId: index,
        cardInfo: cardInfo,
        state: CARD_STATES.COVER,
        showImage: false,
        //sequenceNumber: cardNumber++,
      };

      const card2 = {
        id: index * 2 + 1,
        sourceId: index,
        cardInfo: cardInfo,
        state: CARD_STATES.COVER,
        showImage: false,
        //sequenceNumber: cardNumber++,
      };

      newCards.push(card1, card2);
    });

    // Shuffle the cards
    newCards = shuffleCards(newCards);

    // Then assign sequence numbers up to their final position
    newCards = newCards.map((card, index) => ({
      ...card,
      sequenceNumber: index + 1, // Start from 1
    }));
    setCards(newCards);
  };

  // Shuffle cards (Fisher-Yates algorithm)
  const shuffleCards = (cardsToShuffle) => {
    const shuffled = [...cardsToShuffle];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Render card content based on state
  const renderCardContent = (card) => {
    if (card.state === CARD_STATES.OPEN || card.state === CARD_STATES.MATCHED) {
      // Get filename with extension for the image
      const filename = `${card.cardInfo.displayName}.jpg`;
      const encodedFilename = encodeURIComponent(filename);

      if (!card.cardInfo || !card.cardInfo.displayName) {
        console.error("Card data is missing or incomplete:", card);
        return <div className="text-white">Error: Invalid card data</div>;
      }

      return (
        <div className="flex items-center justify-center h-full w-full overflow-hidden relative">
          {/* Show card image */}
          <img
            src={`${import.meta.env.BASE_URL}img/${encodedFilename}`}
            // src={`/img/${encodedFilename}`}
            alt={card.cardInfo.displayName}
            className="w-full h-full object-cover"
          />
          {/* Display card name in center for 1 second after opening */}
          {card.showImage && card.state === CARD_STATES.OPEN && (
            <div
              className="absolute bg-black bg-opacity-70 text-white p-2 rounded text-center"
              style={{
                userSelect: "none", // Prevents text selection
                cursor: "default", // Ensures cursor doesn't change
              }}
            >
              {card.cardInfo.displayName}
            </div>
          )}
        </div>
      );
    }

    // Show card back
    return (
      <div className="flex items-center justify-center h-full w-full relative">
        <img
          src={`${import.meta.env.BASE_URL}cover.jpg`}
          alt="Card back"
          className="w-full h-full object-cover"
        />

        {/* Number overlay on card cover */}
        <div
          className="absolute flex items-center justify-center"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            color: "#FFC472",
            fontWeight: "bold",
            fontSize: "2rem",
            textShadow: "1px 1px 2px black",
          }}
        >
          {card.sequenceNumber}
        </div>
      </div>
    );
  };

  // State for fullscreen image view
  const [fullscreenCard, setFullscreenCard] = useState(null);

  const handleCardClick = (clickedCard) => {
    // If fullscreen mode is active, exit it on any click
    if (fullscreenCard) {
      setFullscreenCard(null);
      return;
    }

    if (isProcessingClick) {
      // To prevent processing of fast clicking
      return;
    }

    // Ignore clicks on already matched or open cards
    if (
      clickedCard.state === CARD_STATES.MATCHED ||
      clickedCard.state === CARD_STATES.OPEN
    ) {
      return;
    }

    // Check if there's an open card
    // Check if there's an open card
    if (openCard !== null) {
      // If clicking a matching card
      if (openCard.sourceId === clickedCard.sourceId) {
        // Mark that we're processing a click
        setIsProcessingClick(true);

        // Show the 2nd card image
        setCards((prevCards) =>
          prevCards.map((card) =>
            card.id === clickedCard.id
              ? { ...card, state: CARD_STATES.OPEN, showImage: true }
              : card
          )
        );

        // Always hide text after the same duration
        setTimeout(() => {
          setCards((prevCards) =>
            prevCards.map((card) =>
              card.id === clickedCard.id ? { ...card, showImage: false } : card
            )
          );
        }, NAME_DISPLAY_DURATION);

        // Wait 0.5 seconds before starting animation
        setTimeout(() => {
          // This will apply the "spinning-effect" class via your JSX
          setMatchEffectCards([openCard.id, clickedCard.id]);

          // After animation completes (1s), update the matched state
          setTimeout(() => {
            // Remove animation class
            setMatchEffectCards([]);

            // Mark cards as matched
            setCards((prevCards) =>
              prevCards.map((card) =>
                card.id === clickedCard.id || card.id === openCard.id
                  ? { ...card, state: CARD_STATES.MATCHED, showImage: false }
                  : card
              )
            );

            // Update game state
            const newMatchedPairs = matchedPairs + 1;
            setMatchedPairs(newMatchedPairs);
            setOpenCard(null);

            // Allow new clicks
            setIsProcessingClick(false);

            if (newMatchedPairs === TOTAL_PAIRS) {
              setIsGameOver(true);
            }
          }, 1000); // Wait for animation to complete (1s as per your CSS)
        }, NAME_DISPLAY_DURATION + 100); // Start animation after name display
      } else {
        // Not a match - close the previously open card
        // Mark that we're processing a click
        setIsProcessingClick(true);

        setCards((prevCards) =>
          prevCards.map((card) => {
            if (card.id === clickedCard.id) {
              // Open the clicked card
              return { ...card, state: CARD_STATES.OPEN, showImage: true };
            } else if (card.id === openCard.id) {
              // Close the previously open card
              return { ...card, state: CARD_STATES.COVER, showImage: false };
            } else {
              return card;
            }
          })
        );

        // Set the new open card
        setOpenCard(clickedCard);

        // Hide the text after the consistent duration
        setTimeout(() => {
          setCards((prevCards) =>
            prevCards.map((card) =>
              card.id === clickedCard.id ? { ...card, showImage: false } : card
            )
          );

          // Allow new clicks after display duration
          setIsProcessingClick(false);
        }, NAME_DISPLAY_DURATION);
      }
    } else {
      // No open card yet - just open the clicked card
      // Mark that we're processing a click
      setIsProcessingClick(true);

      setCards((prevCards) =>
        prevCards.map((card) =>
          card.id === clickedCard.id
            ? { ...card, state: CARD_STATES.OPEN, showImage: true }
            : card
        )
      );

      // Set this as the open card
      setOpenCard(clickedCard);

      // Hide the text after the same consistent duration
      setTimeout(() => {
        setCards((prevCards) =>
          prevCards.map((card) =>
            card.id === clickedCard.id ? { ...card, showImage: false } : card
          )
        );

        // Allow new clicks after display duration
        setIsProcessingClick(false);
      }, NAME_DISPLAY_DURATION);
    }
  };

  // Handle double click for fullscreen view
  const handleCardDoubleClick = (card) => {
    if (card.state === CARD_STATES.OPEN || card.state === CARD_STATES.MATCHED) {
      setFullscreenCard(card);
    }
  };

  // Handle long press for mobile
  const handleLongPress = (() => {
    let timer = null;
    let longPressTriggered = false;

    return {
      start: (card) => {
        longPressTriggered = false;
        timer = setTimeout(() => {
          if (
            card.state === CARD_STATES.OPEN ||
            card.state === CARD_STATES.MATCHED
          ) {
            setFullscreenCard(card);
            longPressTriggered = true;
          }
        }, 500); // 500ms for long press
      },
      end: () => {
        clearTimeout(timer);
        return longPressTriggered;
      },
    };
  })();

  // To handle screen resizing
  useEffect(() => {
    const handleResize = () => {
      setColumns(getColumnsForScreenWidth());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isGameOver) {
      // Start with small scale and invisible
      setCongratsScale(0.3);
      setCongratsOpacity(0);

      // First step of animation - grow and fade in
      setTimeout(() => {
        setCongratsScale(1.05);
        setCongratsOpacity(1);
      }, 100);

      // Second step - slight bounce back
      setTimeout(() => {
        setCongratsScale(0.95);
      }, 400);

      // Final step - return to normal size
      setTimeout(() => {
        setCongratsScale(1);
      }, 600);

      // Set focus on the "Play Again" button after animation completes
      setTimeout(() => {
        if (playAgainButtonRef.current) {
          playAgainButtonRef.current.focus();
        }
      }, 700); // Set focus after animation is mostly complete
    }
  }, [isGameOver]);

  const newGameButtonRef = React.useRef(null);

  // UseEffect to handle button focus
  useEffect(() => {
    // Focus the button when:
    // 1. The component has mounted
    // 2. The game is not started
    // 3. We're not in loading state
    if (!gameStarted && !isLoading && newGameButtonRef.current) {
      // Use setTimeout to ensure DOM is fully rendered
      setTimeout(() => {
        newGameButtonRef.current.focus();
      }, 100);
    }
  }, [gameStarted, isLoading]);

  // Dynamic number of columns determination
  const getCardStyle = () => {
    return {
      width: `calc(${100 / columns}% - 8px)`,
      // width: `calc((100% - ${(columns - 1) * 8}px) / ${columns})`,
      aspectRatio: "1/1", // Square cards for images
      margin: "4px",
      // Remove jerking on hover with this transform approach
      transform: "translateZ(0)", // Forces GPU acceleration
      willChange: "transform", // Hint to browser about upcoming transform
      transition: "all 0.2s ease", // Smooths any transitions
    };
  };

  return (
    <div
      className="flex flex-col items-center text-white w-full max-w-4xl mx-auto p-4"
      style={{ backgroundColor: "#0E0E0E", color: "#FFC472" }}
    >
      <h1 className="text-5xl font-bold mb-6 text-center">Twins 1</h1>

      {/* UI settings */}
      <div className="mb-6 flex flex-col items-center">
        <div
          className="flex items-center mb-2 bg-gray-800 p-3 rounded-lg"
          style={{ userSelect: "none" }}
        >
          <label
            htmlFor="pairCount"
            className="mr-3 font-semibold"
            style={{ color: "#FED296" }}
          >
            Карт (пар):
          </label>
          <input
            id="pairCount"
            type="range"
            min="4"
            max="20"
            value={pairCount}
            onChange={(e) => setPairCount(parseInt(e.target.value))}
            className="mr-3 bg-blue-600"
            style={{ cursor: "pointer" }}
          />
          <span
            className="bg-blue-600 px-2 py-1 rounded-md font-bold"
            style={{
              backgroundColor: "#2A5095",
              minWidth: "2.5rem",
              textAlign: "center",
            }}
          >
            {pairCount}
          </span>
        </div>
        <div className="text-sm text-gray-400" style={{ userSelect: "none" }}>
          Всего карточек: {pairCount * 2}
        </div>
      </div>

      <button
        ref={newGameButtonRef}
        className="py-3 px-8 rounded-lg text-xl font-bold mb-8 transition-all transform cursor-pointer"
        style={{
          backgroundColor: COLORS.tertiary,
          color: "#FFFFFF",
          transition: "all 0.2s ease-in-out",
          userSelect: "none",
          outline: "none",
        }}
        onFocus={(e) => {
          e.currentTarget.style.backgroundColor = COLORS.tertiary;
          e.currentTarget.style.boxShadow = `0 0 10px ${COLORS.tertiary}`;
          e.currentTarget.style.transform = "scale(1.1)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.backgroundColor = COLORS.primary;
          e.currentTarget.style.color = COLORS.buttonText;
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.transform = "scale(1)";
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = COLORS.tertiary;
          e.currentTarget.style.color = "#FFFFFF";
          e.currentTarget.style.transform = "scale(1.1)";
        }}
        onMouseLeave={(e) => {
          if (document.activeElement !== e.currentTarget) {
            e.currentTarget.style.backgroundColor = COLORS.primary;
            e.currentTarget.style.color = COLORS.buttonText;
            e.currentTarget.style.transform = "scale(1)";
          }
        }}
        onClick={initializeGame}
        disabled={isLoading}
      >
        {isLoading ? "Loading images..." : "Играть"}
      </button>

      {isLoading && (
        <div className="text-center mb-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-500 border-r-transparent"></div>
          <p className="mt-2">Loading card images...</p>
        </div>
      )}

      {gameStarted && !isLoading ? (
        <>
          {/* Game board */}
          <div
            className="w-full mb-6 flex flex-wrap justify-center"
            style={{
              width: "100%",
              padding: "0", // Remove padding to make border tight to cards
              border: "4px solid #FFC472",
              backgroundColor: "#FFC472",
            }}
            //style={{ maxWidth: '800px' }}
          >
            {cards.map((card) => (
              <div
                key={card.id}
                className={`
                  ${
                    card.state === CARD_STATES.COVER
                      ? "bg-blue-500"
                      : card.state === CARD_STATES.MATCHED
                      ? "bg-green-500"
                      : "bg-yellow-500"
                  } 
                  rounded-lg shadow-md flex items-center justify-center cursor-pointer transition-all
                  hover:shadow-lg transform hover:scale-102
                  ${matchEffectCards.includes(card.id) ? "spinning-effect" : ""}
                `}
                // ${matchEffectCards.includes(card.id) ? "spinning-effect" : ""}
                // ${matchEffectCards.includes(card.id) ? 'animate-pulse' : ''}
                style={{
                  ...getCardStyle(),
                  ...(matchEffectCards.includes(card.id)
                    ? {
                        boxShadow:
                          "0 0 0 4px gold, 0 0 15px 5px rgba(255, 215, 0, 0.6)",
                      }
                    : {}),
                }}
                onClick={() => handleCardClick(card)}
                onDoubleClick={() => handleCardDoubleClick(card)}
                onTouchStart={() => handleLongPress.start(card)}
                onTouchEnd={() => handleLongPress.end()}
              >
                {renderCardContent(card)}
              </div>
            ))}
          </div>

          {/* Game Over message */}
          {isGameOver && (
            <div className="fixed inset-0 flex items-center justify-center z-40 pointer-events-none">
              <div
                className="px-8 py-6 rounded-lg text-center shadow-2xl pointer-events-auto"
                // className="bg-green-100 border-4 border-green-500 text-green-700 px-8 py-6 rounded-lg text-center shadow-2xl pointer-events-auto"
                style={{
                  marginBottom: "35vh", // Position it above the game board
                  maxWidth: "90%",
                  boxShadow: "0 0 20px rgba(34, 197, 94, 0.6)",
                  animation: "none", // We'll use React state for animation instead
                  transform: `scale(${congratsScale})`, // Scale based on state
                  opacity: congratsOpacity, // Opacity based on state
                  transition: "transform 0.6s ease-out, opacity 0.6s ease-out",
                }}
              >
                <h2 className="text-3xl font-bold mb-2">Поздравляем!</h2>
                <p className="text-xl">Вы нашли все пары!</p>
                <button
                  className="mt-4 bg-green-500 hover:bg-green-600 text-white py-2 px-6 rounded-lg font-bold transition-colors"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.tertiary;
                    e.currentTarget.style.color = "#FFFFFF";
                    e.currentTarget.style.transform = "scale(1.1)";
                  }}
                  onClick={initializeGame}
                  autoFocus={!gameStarted}
                >
                  Играть снова
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center text-gray-600 text-xl">
          {/* Press the New Game button to start playing */}
        </div>
      )}
      {/* Fullscreen image view */}
      {fullscreenCard && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={() => setFullscreenCard(null)}
        >
          <div className="max-w-2xl max-h-2xl p-4">
            <img
              src={`${import.meta.env.BASE_URL}img/${encodeURIComponent(
                `${fullscreenCard.cardInfo.displayName}.jpg`
              )}`}
              // src={`/img/${encodeURIComponent(
              //   `${fullscreenCard.cardInfo.displayName}.jpg`
              // )}`}
              alt={fullscreenCard.cardInfo.displayName}
              className="max-w-full max-h-full object-contain"
            />
            <div className="text-white text-center mt-4 text-xl">
              {fullscreenCard.cardInfo.displayName}
            </div>
          </div>
        </div>
      )}
      {isGameOver && (
        <div className="fixed inset-0 flex items-center justify-center z-40 pointer-events-none">
          <div
            className="text-center shadow-2xl pointer-events-auto"
            style={{
              marginBottom: "35vh", // Position it above the game board
              maxWidth: "90%",
              backgroundColor: COLORS.background, // Almost black background
              borderColor: COLORS.secondary, // blue border
              borderWidth: "4px",
              borderStyle: "solid",
              color: COLORS.primary, // black text
              padding: "2rem",
              borderRadius: "0.5rem",
              boxShadow: `0 0 20px ${COLORS.primary}`, // Yellow-orange glow
              transform: `scale(${congratsScale})`,
              opacity: congratsOpacity,
              transition: "transform 0.6s ease-out, opacity 0.6s ease-out",
            }}
          >
            <h2 className="text-3xl font-bold mb-2">Поздравляем!</h2>
            <p className="text-xl">Вы нашли все пары!</p>
            <button
              ref={playAgainButtonRef}
              className="mt-4 font-bold py-2 px-6 rounded-lg transition-all"
              style={{
                backgroundColor: COLORS.primary, // Yellow-orange button
                color: COLORS.buttonText, // Dark text on button
                border: `2px solid ${COLORS.primary}`,
                transform: "scale(1)",
                transition: "all 0.2s ease-in-out",
              }}
              onFocus={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.tertiary; // Lighter yellow on focus
                e.currentTarget.style.borderColor = COLORS.tertiary;
                e.currentTarget.style.color = "#FFFFFF";
                e.currentTarget.style.boxShadow = `0 0 10px ${COLORS.tertiary}`;
                e.currentTarget.style.transform = "scale(1.2)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.primary;
                e.currentTarget.style.borderColor = COLORS.primary;
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "scale(1)";
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.tertiary; // Lighter green on hover
                e.currentTarget.style.borderColor = COLORS.tertiary;
                e.currentTarget.style.color = "#FFFFFF";
                e.currentTarget.style.transform = "scale(1.2)";
              }}
              onMouseLeave={(e) => {
                if (document.activeElement !== e.currentTarget) {
                  e.currentTarget.style.backgroundColor = COLORS.primary;
                  e.currentTarget.style.borderColor = COLORS.primary;
                  e.currentTarget.style.transform = "scale(1)";
                }
              }}
              onClick={initializeGame}
            >
              Играть снова
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Twins1;
