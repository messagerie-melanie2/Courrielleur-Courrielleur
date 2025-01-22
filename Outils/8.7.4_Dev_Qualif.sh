#!/bin/bash
#
# modifie l'environnement du courrielleur 8.7.4 de Dev vers Qualif


PS3="Modifier l'environnement du dépôt courrielleur de Dev vers Qualif ?"


rep=$(dirname $0)

# chemin du courrielleur relatif au chemin du script dans le dépôt git
# on a typiquement l'arborescence suivante:
# courrielleur-a-plat
# |_mi-courrielleur-8.7.4_win64_plat
# |_mi-courrielleur-xxx_win64_plat
# |_Outils
chemin=$rep"/../mi-courrielleur-8.7.4_win64_plat"

# urls/valeurs originales
source $rep/urls-Dev.txt

# urls/valeurs finales
source $rep/urls-Qualif.txt

# chemin courrielleur
source $rep/modifUrls.sh

ModifieUrls chemin urls_DEV urls_QUALIF

