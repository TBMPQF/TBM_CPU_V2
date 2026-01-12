Bot Discord by TBMPQF, n'hésitez pas a venir sur Discord pour de plus amples informations : [https://discord.gg/『 𝐓𝐁𝐌𝐏𝐐𝐅ᴬᴹᴵᴸʸ 』](https://discord.gg/WURHhGhwBA)

# Ajout d'élément dans le config.json

## Modifier la création du fichier dans le containeur Docker
- Ouvrir le fichier docker/create-config.sh
- Ajouter les éléments voulus dans la section correspondante

## Ajouté la variable dans portainer
- Dans la stack TBM_CPU_V2, ajouter la variable d'environnement correspondante à la valeur de la nouvelle entrée du config.json
- Redémarrer la stack avec '*Re-pull image and redeploy*' cochée