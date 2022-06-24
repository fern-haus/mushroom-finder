const getRandom = (arr) => arr[~~(Math.random() * arr.length)],
    mushroomInfoElem = document.getElementById("mushroom-info");

function mushroomHandler(event) {
    event.preventDefault();
    const miles = event.target.miles.value;
    navigator.geolocation.getCurrentPosition(
        (pos) => getRandomMushroom(pos, miles),
        (error) => displayMushroom({ error })
    );
}

function getRandomMushroom(position, miles) {
    mushroomInfoElem.innerHTML = "Finding mushrooms...";
    const { coords } = position,
        {
            maxLat: north,
            minLat: south,
            maxLong: east,
            minLong: west,
        } = getRange({ coords, miles }),
        endpoint = "https://mushroomobserver.org/api2/observations?format=json",
        url = `${endpoint}&north=${north}&south=${south}&east=${east}&west=${west}`;
    fetch(url)
        .then((resp) => resp.json())
        .then((data) => getRandom(data.results))
        .then((randomId) =>
            fetch(`${endpoint}&id=${randomId}&detail=high`)
                .then((resp) => resp.json())
                .then((data) => data.results[0])
                .then((mushroom) => displayMushroom({ coords, mushroom }))
                .catch((error) => displayMushroom({ error }))
        )
        .catch((error) => displayMushroom({ error }));
}

function getRange({ coords, miles }) {
    const { latitude, longitude } = coords,
        // 2,500 square miles (50x50) with user at center
        milesTo1DegLat = 69,
        milesTo1DegLong = 54.6,
        latMiles = miles / milesTo1DegLat,
        longMiles = miles / milesTo1DegLong,
        formatNumber = (num) => num.toFixed(4);
    return {
        maxLat: formatNumber(+latitude + latMiles),
        minLat: formatNumber(+latitude - latMiles),
        maxLong: formatNumber(+longitude + longMiles),
        minLong: formatNumber(+longitude - longMiles),
    };
}

function displayMushroom({ coords, mushroom, error }) {
    if (error) {
        mushroomInfoElem.innerHTML = `
            <p>Could not load mushrooms. Something went wrong.</p>
            <p><u>Error message</u>: ${error.message}</p>`;
    } else {
        const firstImage = mushroom.images[0],
            { date: dateTaken, owner } = firstImage,
            { login_name: username, id: userID } = owner;
        mushroomInfoElem.innerHTML = `
            <p>
                Your Latitude: ${coords.latitude || "N/A"}
                <br />
                Your Longitude: ${coords.longitude || "N/A"}
            </p>
            ${mushroom.images
                .map(
                    (image) => `
                <a href="${
                    image.original_url
                }" target="_blank" rel="noreferrer">
                    <img
                        className="mushroom-image"
                        src=${image.original_url}
                        alt=${`most likely the fungus ${mushroom.consensus.name}`}
                    />
                </a>`
                )
                .join("")}
            <div className="caption">
                This is <em><a
                        href=${`https://en.wikipedia.org/wiki/${mushroom.consensus.name.replaceAll(
                            " group",
                            ""
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                    >${mushroom.consensus.name}</a></em>,
                    according to members of <strong>MushroomObserver.org</strong>
                    (<a
                        href=${`https://mushroomobserver.org/${mushroom.id}`}
                        target="_blank"
                        rel="noreferrer"
                    >view page</a>)
                <br />
                &copy; <a
                    href=${`https://mushroomobserver.org/observer/show_user/${userID}`}
                    target="_blank"
                    rel="noreferrer"
                >${username}</a> on ${dateTaken} in ${mushroom.location.name}
            </div>`;
    }
}
