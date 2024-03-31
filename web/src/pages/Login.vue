

<template>
	<div class="w-full h-full items-center flex">
		<div class="flex flex-col m-auto gap-10">
			<section class="flex w-[500px] h-[500px] bg-neutral-800 shadow-md rounded-sm items-center justify-center">
				<v-form class="w-3/4 gap-16 h-fit flex flex-col  " fast-fail>
				
					<v-text-field 
						variant="outlined" 
						label="Login"
						v-model="login.value.value"
					/>

					<v-text-field 
						variant="outlined" 
						label="Password"
						v-model="password.value.value"
					/>

					<div class="m-auto">
						<v-btn color="primary" @click="submit">
							Login
						</v-btn>
					</div>

				</v-form>
			</section>
			<v-alert text="jopa" type="error" />
		</div>
	</div>
</template>




<script setup lang="ts">
import { ref } from 'vue'

import { useField, useForm } from 'vee-validate'

type Inputs = {
	login: string,
	password: string
}

const { handleSubmit } = useForm<Inputs>()

const login = useField('login')
const password = useField('password')

const submit = handleSubmit(async ({ login, password }) => {

	console.log(login, password)
})

</script>
