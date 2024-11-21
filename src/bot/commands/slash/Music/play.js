////   DEPENDENCIAS  ////
require("dotenv").config()
const PATH = require("path");
const FS = require("fs");
const YTDL = require("@distube/ytdl-core");
const YTSEARCH = require("yt-search");
const SCDownloader = require("soundcloud-downloader").default;
const SpotifyWebApi = require("spotify-web-api-node");
const { stringSimilarity } = require("string-similarity-js");
const { createAnswer, getGuildQueue, logger } = require(PATH.resolve("src", "bot", "utilities", "utilities.js"));
const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { createAudioResource, getVoiceConnection, entersState, AudioPlayerStatus} = require("@discordjs/voice");
////   CONSTANTES  ////
const Config = JSON.parse(FS.readFileSync(PATH.resolve("config","db.json")));
const LOCAL_MUSIC_DIR = PATH.resolve("src", "music_files"); 
const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});
const laSalsera = "https://radio5.domint.net:8110/stream";
let spotifyEnabled = true;
(async () => {
    try {
        const tokenResponse = await spotifyApi.clientCredentialsGrant();
        spotifyApi.setAccessToken(tokenResponse.body.access_token);
    } catch (error) {
        logger.warn("No se pudo autenticar con Spotify. Se utilizará SoundCloud para respaldo en categorías.");
        spotifyEnabled = false;
    }
})();
////   INICIO CODIGO ////
module.exports = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Reproduce música desde distintas fuentes hell yea.")
        .addSubcommand(subcommand =>
            subcommand
                .setName("cancion")
                .setDescription("Reproduce una canción desde distintas fuentes.")
                .addStringOption(option =>
                    option.setName("fuente")
                        .setDescription("Selecciona la fuente de la música.")
                        .setRequired(true)
                        .addChoices(
                            { name: "YouTube", value: "youtube" },
                            { name: "Spotify", value: "spotify" },
                            { name: "SoundCloud", value: "soundcloud" },
                            { name: "Archivo/Link", value: "local" },
                        )
                )
                .addStringOption(option =>
                    option.setName("busqueda")
                        .setDescription("Ingresa el enlace, búsqueda o categoría.")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("playlist")
                .setDescription("Reproduce una playlist desde distintas fuentes.")
                .addStringOption(option =>
                    option.setName("fuente")
                        .setDescription("Selecciona la fuente de la playlist.")
                        .setRequired(true)
                        .addChoices(
                            { name: "YouTube", value: "youtube" },
                            { name: "Spotify", value: "spotify" },
                            { name: "SoundCloud", value: "soundcloud" }
                        )
                )
                .addStringOption(option =>
                    option.setName("busqueda")
                        .setDescription("Ingresa el enlace o busca una playlist.")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("categoria")
                .setDescription("Reproduce canciones al azar de una categoría.")
                .addStringOption(option =>
                    option.setName("categoria")
                        .setDescription("Especifica la categoría (Rock, Pop, etc).")
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName("cantidad")
                        .setDescription("Cantidad de canciones a agregar ()")
                        .setRequired(false)
                        .setMinValue(1)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("radio")
                .setDescription("Sintoniza una emisora de radio.")
                .addStringOption(option =>
                    option.setName("emisora")
                        .setDescription("Ingresa el enlace o selecciona una emisora.")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Connect),
    async autocomplete(Client, Interaction) {
        const subcommand = Interaction.options.getSubcommand();

        try {
            if (subcommand === "playlist" || subcommand === "cancion") {
                const query = Interaction.options.getString("busqueda");
                if (!query || query === "") return;
                const type = Interaction.options.getString("fuente");
    
                if (type === "youtube") {
                    const results = await YTSEARCH({ query: query});
                    const rOptions = subcommand === "playlist"
                    ? results.playlists.slice(0, 5)
                    : results.videos.slice(0, 5);
                    return Interaction.respond(
                        subcommand === "playlist"
                        ? rOptions.map(option => ({ name: option.title, value: option.listId }))
                        : rOptions.map(option => ({ name: option.title, value: option.url  }))
                    );
                }
    
                if (type === "soundcloud") {
                    const results = subcommand === "playlist"
                    ? await SCDownloader.search({ limit: 5, query, resourceType: 'playlists' })
                    : await SCDownloader.search({ limit: 5, query: query, resourceType: 'tracks' });
                    const rOptions = results.collection || [];
                    return Interaction.respond(
                        rOptions.map(option => ({ name: option.title, value: option.permalink_url.split("https://soundcloud.com/")[1] }))
                    );
                }
    
                if (type === "spotify") {
                    if (spotifyEnabled) {
                        const results = subcommand === "playlist"
                        ? await spotifyApi.searchPlaylists(query, { limit: 5 })
                        : await spotifyApi.searchTracks(query, { limit: 5 });
                        const rOptions = subcommand === "playlist"
                        ? results.body.playlists.items
                        : results.body.tracks.items;
                        return Interaction.respond(
                            subcommand === "playlist"
                            ? rOptions.map(pl => ({name: pl.name, value: pl.id }))
                            : rOptions.map(track => ({ name: `${track.name} - ${track.artists[0].name}`, value: track.id }))
                        );
                    } else {
                        return Interaction.respond([{name: "Sin acceso a la API de Spotify", value: "NO_RESULTS"}])
                    }
                }
            }
    
            if (subcommand === "radio") {
                const query = Interaction.options.getString("emisora");
                if (!query || query === "") return;
    
                const stations = await fetchRadioStation(query);
    
                if (stations.length === 0) {
                    return Interaction.respond([{ name: "No se encontraron emisoras", value: "NO_RESULTS" }]);
                }

                return Interaction.respond(
                    stations.map(st => ({ name: st.name, value: st.url }))
                );
            }    
        } catch(error){
            //logger.warn(`[PLAY AUTOCOMPLETE] Posible error.`);
        }
        return Interaction.respond([{ name: "Sin resultados.", value: "NO_RESULTS" }]);
    },
    async execute(Client, Interaction) {
        await Interaction.deferReply();    
        await createAnswer(Interaction, "Procesando...", false);
        const subcommand = Interaction.options.getSubcommand();

        if (!Interaction.member.voice.channel) {
            return createAnswer(Interaction, "Debes estar en un canal de voz para usar este comando.", true, 5);
        }
        const voiceChannel = Interaction.member.voice.channel;
        const existingConnection = getVoiceConnection(Interaction.guild.id);
    
        if (existingConnection && existingConnection.joinConfig.channelId !== voiceChannel.id) {
            return createAnswer(Interaction, "El bot ya está conectado a otro canal de voz.", true, 5);
        }
        const queue = getGuildQueue(Interaction.guild.id, voiceChannel);

        try {
            if (Config.onlySalsaHellYea) {
                await handleRadioPlayback(Client, Interaction, queue, true);
            } else {
                if (subcommand === "cancion") {
                    await handleSongPlayback(Client, Interaction, queue);
                } else if (subcommand === "playlist") {
                    await handlePlaylistPlayback(Client, Interaction, queue);
                } else if (subcommand === "categoria") {
                    await handleCategoryPlayback(Client, Interaction, queue);
                } else if (subcommand === "radio") {
                    await handleRadioPlayback(Client, Interaction, queue);
                }
            }
        } catch (error) {
            logger.error(`[PLAY-${subcommand}] ${error}`);
            if (error.message && error.message.includes("to confirm")) {
                return createAnswer(Interaction, "Youtube bloqueo la descarga.", true, 5);
            }
            return createAnswer(Interaction, "No se puede reproducir la busqueda proveida.", true, 5);
        }
    },
};

// Sub comandos
async function handleSongPlayback(Client, Interaction, queue) {
    const type = Interaction.options.getString("fuente");
    const query = Interaction.options.getString("busqueda");

    let song;
    switch (type) {
        case "youtube":
            song = await handleYouTube(query);
            break;
        case "soundcloud":
            song = await handleSoundCloud(query);
            break;
        case "spotify":
            if (!spotifyEnabled) return createAnswer(Interaction, "Sin acceso a la API de Spotify", true, 5);
            song = await handleSpotify(query);
            break;
        case "local":
            song = handleLocal(query);
            break;
        default:
            return createAnswer(Interaction, "Fuente inválida.", true, 5);
    }

    if (!song) return createAnswer(Interaction, "No se encontró la canción.", true, 5);

    queue.songs.push(song);
    if (!queue.playing) {
        if (playSong(queue, Interaction)) {
            await createAnswer(Interaction, `🎵 Reproduciendo: ${song.title}`, false);
        } else {
            await createAnswer(Interaction, "No se pudo reproducir", true, 5); 
        }
    } else {
        await createAnswer(Interaction, `🎵 Sonido agregado a la cola: ${song.title} `, false);
    }
}
async function handlePlaylistPlayback(Client, Interaction, queue) {
    const type = Interaction.options.getString("fuente");
    const query = Interaction.options.getString("busqueda");

    let tracks = [];
    switch (type) {
        case "youtube":
            tracks = await handleYouTube(query, true);
            break;
        case "soundcloud":
            tracks = await handleSoundCloud(query, true);
            break;
        case "spotify":
            if (!spotifyEnabled) return createAnswer(Interaction, "Sin acceso a la API de Spotify", true, 5);
            tracks = await handleSpotify(query, true);
            break;
        default:
            return createAnswer(Interaction, "Fuente inválida.", true, 5);
    }

    if (!tracks || !tracks.length) {
        return createAnswer(Interaction, "No se encontraron canciones en la playlist.", true, 5);
    }

    queue.songs.push(...tracks);
    if (!queue.playing) {
        if (playSong(queue, Interaction)) {
            await createAnswer(Interaction, `🎵 Playlist agregada a la cola: ${tracks.length} canciones.`, false);
        } else {
            await createAnswer(Interaction, "No se pudo reproducir", true, 5); 
        }
    }
}
async function handleCategoryPlayback(Client, Interaction, queue) {
    const category = Interaction.options.getString("categoria");
    const ammount = Interaction.options.getInteger("cantidad") || 10;
    let genreFilteredSongs = [];

    if (spotifyEnabled) {
        const results = await spotifyApi.searchTracks(`genre:${category}`, { limit: ammount });
        genreFilteredSongs = results.body.tracks.items.map(track => ({
            title: `${track.name} - ${track.artists[0].name}`,
            url: findEquivalent({ name: track.name, author: track.artists[0].name}),
        }));
    } 

    if (genreFilteredSongs.length === 0 || !spotifyEnabled) {
        let totalFound = 0;
        let offset = 0;

        while (totalFound < ammount) {
            offset = Math.floor(Math.random() * 100);

            const results = await SCDownloader.search({ 
                query: category, 
                resourceType: 'tracks', 
                limit: 5,
                offset: offset 
            });

            const newSongs = results.collection.filter(track => {
                const trackGenres = (track.genre || '').toLowerCase();
                const queryLower = category.toLowerCase();
                return trackGenres.includes(queryLower);
            });

            genreFilteredSongs.push(...newSongs.map(track => ({
                title: track.title,
                url: track.permalink_url
            })));

            totalFound = genreFilteredSongs.length;

            if (totalFound >= ammount) break;
        }

        await createAnswer(Interaction.channel, "Nota: Usando SoundCloud como respaldo, los resultados pueden ser imprecisos.", false, 5);
    }

    if (genreFilteredSongs.length < ammount) {
        const randomTracks = await SCDownloader.search({ query: category, resourceType: 'tracks', limit: ammount });

        const uniqueTracks = randomTracks.collection.filter(track => 
            !genreFilteredSongs.some(existingTrack => existingTrack.url === track.permalink_url)
        );

        genreFilteredSongs.push(...uniqueTracks.map(track => ({
            title: track.title,
            url: track.permalink_url
        })));
    }

    if (genreFilteredSongs.length) {
        const uniqueSongs = [];
        const seenUrls = new Set();

        for (const song of genreFilteredSongs) {
            if (!seenUrls.has(song.url)) {
                uniqueSongs.push(song);
                seenUrls.add(song.url);
            }
        }

        queue.songs.push(...uniqueSongs);
        if (!queue.playing) {
            playSong(queue, Interaction);
        }

        await createAnswer(Interaction, `🎵 ${uniqueSongs.length} canciones de la categoría ${category} agregadas.`, false);
    } else {
        await createAnswer(Interaction, "No se encontraron canciones para la categoría especificada.", true, 5);
    }
}
async function handleRadioPlayback(Client, Interaction, queue, force = false) {
    let radioUrl = Interaction.options.getString("emisora");
    if (radioUrl === "NO_RESULTS") return createAnswer(Interaction, "No se encontraron resultados.", true, 5);
    let forced = false;
    if (Config.onlySalsaHellYea && force) {
        if (!(radioUrl === laSalsera)) {
            radioUrl = laSalsera;
            forced = true;
        }
    }

    const track = { title: "Emisora", url: radioUrl };

    queue.songs.push(track);
    if (!queue.playing) {
        playSong(queue, Interaction);
    }

    if (Config.onlySalsaHellYea && forced) {
        await createAnswer(Interaction, `🎵 Nada de esa mierda, hop en la salsera.`, false);
    } else if (Config.onlySalsaHellYea) {
        await createAnswer(Interaction, `🎵 Hell yea, sintonizando a la salsera.`, false);
    } else {
        await createAnswer(Interaction, `🎵 Sintonizando radio: ${radioUrl}`, false);
    }
}

// Extractores
async function handleYouTube(query, playlist = false) {
    try {
        if (playlist) {
            const results = await YTSEARCH({ listId: query });
            return results.videos.map(video => ({
                title: video.title,
                url: video.url
            }));
        } else {
            if (YTDL.validateURL(query)) {
                const songInfo = await YTDL.getInfo(query);
                return { title: songInfo.videoDetails.title, url: songInfo.videoDetails.video_url };
            } else {
                const results = await YTSEARCH(query);
                const video = results.videos[0];
                if (video) {
                    return { title: video.title, url: video.url };
                }
            }
        }
    } catch (error) {
        logger.error(`[YouTube Error]: ${error.message}`);
        return null;
    }
}

async function handleSoundCloud(query, playlist = false) {
    const scdDomain = "https://soundcloud.com/";
    const fullUrl = scdDomain + query;

    if (SCDownloader.isValidUrl(fullUrl)) {
        const info = playlist
            ? await SCDownloader.getSetInfo(fullUrl).catch(() => null)
            : await SCDownloader.getInfo(fullUrl).catch(() => null);

        if (info) {
            if (playlist && info.tracks) {
                return info.tracks.map(t => ({ title: t.title, url: t.permalink_url }));
            }
            if (!playlist && info.title) {
                return { title: info.title, url: fullUrl };
            }
        }
    }

    const results = playlist
        ? await SCDownloader.search({ limit: 1, query, resourceType: 'playlists' }) 
        : await SCDownloader.search({ limit: 1, query, resourceType: 'tracks' });

    if (results && results.collection && results.collection.length > 0) {
        const firstResult = results.collection[0];
        const resultUrl = firstResult.permalink_url.split("https://soundcloud.com/")[1];
        if (playlist && firstResult.kind === "playlist") {
            return handleSoundCloud(resultUrl, true);
        } else if (!playlist && firstResult.kind === "track") {
            return handleSoundCloud(resultUrl, false);
        }
    }

    return null;
}

function evaluateMatch(trackInfo, result) {
    const titleScore = stringSimilarity(trackInfo.name, result.title);
    const authorScore = stringSimilarity(trackInfo.author, result.author);
    return titleScore * 0.7 + authorScore * 0.3; 
}

async function searchYouTube(trackInfo) {
    const youtubeResults = await YTSEARCH({ query: `${trackInfo.name} ${trackInfo.author}`});
    const bestMatch = youtubeResults.videos[0];
    if (bestMatch) {
        return {
            title: bestMatch.title,
            author: bestMatch.author.name,
            url: bestMatch.url
        };
    }
    throw new Error("No se encontraron resultados en YouTube.");
}

async function searchSoundCloud(trackInfo) {
    const soundCloudResults = await SCDownloader.search({
        query: `${trackInfo.name} ${trackInfo.author}`,
        resourceType: trackInfo.playlist ? 'playlists' : 'tracks',
        limit: 5
    });

    if (soundCloudResults.collection.length > 0) {
        const firstResult = soundCloudResults.collection[0];
        return {
            title: firstResult.title,
            author: firstResult.publisher_metadata?.artist || "Desconocido",
            url: firstResult.permalink_url
        };
    }

    throw new Error("No se encontraron resultados en SoundCloud.");
}
async function findEquivalent(trackInfo) {
    try {
        const [ytResult, scResult] = await Promise.allSettled([
            searchYouTube(trackInfo),
            searchSoundCloud(trackInfo)
        ]);

        const ytData = ytResult.status === "fulfilled" ? ytResult.value : null;
        const scData = scResult.status === "fulfilled" ? scResult.value : null;

        const ytScore = ytData ? evaluateMatch(trackInfo, ytData) : 0;
        const scScore = scData ? evaluateMatch(trackInfo, scData) : 0;

        if (ytScore >= scScore && ytData) {
            return ytData.url
        } else if (scData) {
            return scData.url
        }

        throw new Error("No se encontro una coincidencia adecuada en ninguna fuente.");
    } catch(error) {
        logger.error("Error en la busqueda paralela: ", error);
    }
}
async function handleSpotify(query, playlist = false) {
    if (!spotifyApi.getAccessToken()) return null;

    if (playlist) {
        const results = await spotifyApi.getPlaylist(query);
        if (results.body.tracks) {
            return results.body.tracks.items.map(async (item) => ({
                title: item.track.name, url: await findEquivalent({name: item.track.name, author: item.track.artists[0].name})
            }));
        }
    } else {
        const result = await spotifyApi.getTrack(query);
        if (result.body) {
            const track = result.body;
            return { title: track.name, url: await findEquivalent({name: track.name, author: track.artists[0].name})};
        }
    }
    return null;
}

function handleLocal(filename) {
    const filePath = PATH.join(LOCAL_MUSIC_DIR, filename);
    if (!FS.existsSync(filePath)) return null;
    return { title: filename, url: filePath };
}

async function fetchRadioStation(query) {
    const response = await axios.get(`https://de1.api.radio-browser.info/json/stations/search`, {
        params: {
            name: query,
            limit: 5,
        },
    });

    return response.data;
}
// Reproductor
async function extractResource(song, playlist = false) {
    if (!song || !song.url) {
        throw Error("URL no válida o recurso no encontrado.");
    }

    let resource;
    try {
        if (song.url.startsWith("http")) {
            if (song.url.includes("soundcloud")) {
                const stream = await SCDownloader.download(song.url);
                resource = createAudioResource(stream);
            } else if (song.url.includes("spotify")) {
                resource = createAudioResource(song.url, { inputType: "stream"});
            } else if (song.url.includes("youtube")) {
                resource = createAudioResource(
                    YTDL(song.url, { filter: "audioonly", highWaterMark: 1 << 25 })
                );
            } else {
                resource = createAudioResource(song.url, { inputType: 'stream' });
            }
        } else {
            resource = createAudioResource(song.url);
        }
    } catch (error) {
        console.error("Error al extraer el recurso:", error);
        throw Error("El recurso no se pudo extraer correctamente.");
    }

    if (!resource) {
        throw Error("Recurso no válido generado.");
    }
    return resource;
}

async function playSong(queue, Interaction, playlist = false) {
    if (!queue.songs.length) {
        queue.playing = false;
        return createAnswer(Interaction, "La cola está vacía. Finalizando reproducción.", false);
    }

    const song = queue.songs.shift();
    console.log(`Intentando reproducir: ${song.title}`);
    let resource;

    try {
        resource = await extractResource(song, playlist);
    } catch (error) {
        console.error("Error al extraer recurso:", error);
        return createAnswer(Interaction, "Error al reproducir el recurso.", true);
    }

    queue.player.play(resource);

    try {
        console.log("Esperando que el player cambie al estado 'Playing'...");
        await entersState(queue.player, AudioPlayerStatus.Playing, 10000);
        queue.playing = true;
        console.log(`Reproduciendo: ${song.title}`);
    } catch (error) {
        console.error("Error en el estado de reproducción:", error);
        queue.playing = false;
        queue.player.stop();
        return createAnswer(Interaction, "No se pudo iniciar la reproducción.", true);
    }

    queue.player.once(AudioPlayerStatus.Idle, () => {
        console.log("Reproducción finalizada, avanzando a la siguiente canción...");
        playSong(queue, Interaction);
    });
}
