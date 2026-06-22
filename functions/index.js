const functions = require('firebase-functions');
const admin     = require('firebase-admin');
const fetch     = require('node-fetch');

admin.initializeApp();
const db = admin.firestore();

// Scheduled every 24 h — deletes expired videos from the media server
// and nullifies video_url in Firestore
exports.cleanupExpiredVideos = functions
  .pubsub.schedule('every 24 hours')
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();
    const snap = await db.collection('shot_measurements')
      .where('video_expires_at', '<', now)
      .where('video_url', '!=', null)
      .get();

    if (snap.empty) {
      console.log('No expired videos found.');
      return null;
    }

    const MEDIA_SERVER = functions.config().media?.server_url || '';
    const batch = db.batch();
    const deletions = [];

    snap.forEach(doc => {
      const data = doc.data();
      const videoUrl = data.video_url;

      // Ask media server to delete the file
      if (videoUrl && MEDIA_SERVER) {
        const filename = videoUrl.split('/').pop();
        deletions.push(
          fetch(`${MEDIA_SERVER}/api/media/${encodeURIComponent(filename)}`, {
            method: 'DELETE',
          }).catch(e => console.warn('Delete request failed:', e.message))
        );
      }

      // Nullify video_url in Firestore
      batch.update(doc.ref, {
        video_url: null,
        video_expires_at: null,
        video_deleted_at: now,
      });
    });

    await Promise.all(deletions);
    await batch.commit();
    console.log(`Cleaned up ${snap.size} expired video(s).`);
    return null;
  });

// Manual HTTP trigger for testing / admin UI
exports.triggerCleanup = functions.https.onCall(async (_data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');

  const now = admin.firestore.Timestamp.now();
  const snap = await db.collection('shot_measurements')
    .where('video_expires_at', '<', now)
    .where('video_url', '!=', null)
    .get();

  if (snap.empty) return { deleted: 0 };

  const MEDIA_SERVER = functions.config().media?.server_url || '';
  const batch = db.batch();
  const deletions = [];

  snap.forEach(doc => {
    const { video_url } = doc.data();
    if (video_url && MEDIA_SERVER) {
      const filename = video_url.split('/').pop();
      deletions.push(
        fetch(`${MEDIA_SERVER}/api/media/${encodeURIComponent(filename)}`, { method: 'DELETE' })
          .catch(e => console.warn(e.message))
      );
    }
    batch.update(doc.ref, { video_url: null, video_expires_at: null, video_deleted_at: now });
  });

  await Promise.all(deletions);
  await batch.commit();
  return { deleted: snap.size };
});
